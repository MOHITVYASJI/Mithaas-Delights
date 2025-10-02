# enhanced_chatbot.py - Order-aware AI Chatbot System
import os
import uuid
import json
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
import logging

try:
    import google.generativeai as genai
except ImportError:
    genai = None

logger = logging.getLogger(__name__)

# Chatbot Models
class ChatSession(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: Optional[str] = None
    session_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_activity: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_active: bool = True

class ChatMessage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    user_id: Optional[str] = None
    message: str
    response: str
    message_type: str = "user"  # "user" or "bot"
    context_used: Optional[Dict] = None  # Context information used for response
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ChatRequest(BaseModel):
    session_id: str
    message: str
    user_id: Optional[str] = None

class OrderAwareChatBot:
    def __init__(self, db):
        self.db = db
        self.chat_messages = db.chat_messages
        self.chat_sessions = db.chat_sessions
        
        # Initialize Gemini AI
        if genai and os.environ.get('GEMINI_API_KEY'):
            genai.configure(api_key=os.environ.get('GEMINI_API_KEY'))
            self.model = genai.GenerativeModel('gemini-pro')
        else:
            self.model = None
            logger.warning("Gemini AI not configured, using fallback responses")
    
    async def get_or_create_session(self, session_id: str, user_id: Optional[str] = None) -> ChatSession:
        """Get existing session or create new one"""
        session = await self.chat_sessions.find_one({"session_id": session_id})
        
        if not session:
            new_session = ChatSession(
                session_id=session_id,
                user_id=user_id
            )
            await self.chat_sessions.insert_one(
                self._prepare_for_mongo(new_session.dict())
            )
            return new_session
        
        # Update last activity
        await self.chat_sessions.update_one(
            {"session_id": session_id},
            {"$set": {"last_activity": datetime.now(timezone.utc).isoformat()}}
        )
        
        return ChatSession(**self._parse_from_mongo(session))
    
    async def process_message(self, chat_request: ChatRequest) -> Dict[str, Any]:
        """Process chat message with order awareness"""
        # Get or create session
        session = await self.get_or_create_session(
            chat_request.session_id, 
            chat_request.user_id
        )
        
        # Gather context for the user
        context = await self._gather_user_context(chat_request.user_id)
        
        # Generate response
        response = await self._generate_response(
            chat_request.message, 
            context, 
            chat_request.session_id
        )
        
        # Save chat message
        chat_message = ChatMessage(
            session_id=chat_request.session_id,
            user_id=chat_request.user_id,
            message=chat_request.message,
            response=response,
            context_used=context
        )
        
        await self.chat_messages.insert_one(
            self._prepare_for_mongo(chat_message.dict())
        )
        
        return {
            "message": chat_request.message,
            "response": response,
            "session_id": chat_request.session_id,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    
    async def _gather_user_context(self, user_id: Optional[str]) -> Dict[str, Any]:
        """Gather relevant context about the user for better responses"""
        context = {
            "has_user_data": False,
            "recent_orders": [],
            "user_preferences": {},
            "cart_items": [],
            "wishlist_items": []
        }
        
        if not user_id:
            return context
        
        try:
            # Get user information
            user = await self.db.users.find_one({"id": user_id})
            if user:
                context["has_user_data"] = True
                context["user_name"] = user.get("name", "")
                context["user_email"] = user.get("email", "")
                context["wishlist_items"] = user.get("wishlist", [])
            
            # Get recent orders (last 5)
            orders = await self.db.orders.find(
                {"user_id": user_id}
            ).sort("created_at", -1).limit(5).to_list(5)
            
            context["recent_orders"] = [
                {
                    "id": order.get("id", "")[:8],
                    "status": order.get("status", ""),
                    "total_amount": order.get("final_amount", order.get("total_amount", 0)),
                    "created_at": order.get("created_at", ""),
                    "item_count": len(order.get("items", [])),
                    "payment_status": order.get("payment_status", "")
                }
                for order in orders
            ]
            
            # Get current cart
            cart = await self.db.carts.find_one({"user_id": user_id})
            if cart and cart.get("items"):
                context["cart_items"] = [
                    {
                        "product_id": item.get("product_id", ""),
                        "quantity": item.get("quantity", 0),
                        "variant_weight": item.get("variant_weight", "")
                    }
                    for item in cart.get("items", [])
                ]
            
            # Get product names for cart and wishlist items
            if context["cart_items"] or context["wishlist_items"]:
                product_ids = []
                if context["cart_items"]:
                    product_ids.extend([item["product_id"] for item in context["cart_items"]])
                if context["wishlist_items"]:
                    product_ids.extend(context["wishlist_items"])
                
                if product_ids:
                    products = await self.db.products.find(
                        {"id": {"$in": list(set(product_ids))}},
                        {"id": 1, "name": 1}
                    ).to_list(None)
                    
                    product_names = {p["id"]: p["name"] for p in products}
                    
                    # Add product names to context
                    for item in context["cart_items"]:
                        item["product_name"] = product_names.get(item["product_id"], "Unknown")
                    
                    context["wishlist_product_names"] = [
                        product_names.get(pid, "Unknown") for pid in context["wishlist_items"]
                    ]
        
        except Exception as e:
            logger.error(f"Error gathering user context: {str(e)}")
        
        return context
    
    async def _generate_response(self, message: str, context: Dict[str, Any], session_id: str) -> str:
        """Generate AI response using context"""
        # Get conversation history
        history = await self._get_conversation_history(session_id, limit=5)
        
        # Build system prompt with context
        system_prompt = self._build_system_prompt(context)
        
        # Build full prompt
        full_prompt = self._build_full_prompt(message, context, history, system_prompt)
        
        if self.model:
            try:
                response = self.model.generate_content(full_prompt)
                return response.text
            except Exception as e:
                logger.error(f"Gemini AI error: {str(e)}")
                return self._get_fallback_response(message, context)
        else:
            return self._get_fallback_response(message, context)
    
    def _build_system_prompt(self, context: Dict[str, Any]) -> str:
        """Build system prompt with user context"""
        prompt = """
You are a helpful customer service assistant for Mithaas Delights, a premium Indian sweets and snacks store. 
You are knowledgeable about traditional Indian sweets, namkeen, and festival specialties.

Your role:
- Help customers with product inquiries
- Assist with order status and tracking
- Provide information about ingredients and nutritional content
- Help with delivery and pickup options
- Answer questions about festivals and appropriate sweets
- Be friendly, helpful, and culturally aware

Important guidelines:
- Always be respectful and courteous
- If you don't know something, admit it and offer to connect them with human support
- For sensitive order information, only provide general status updates
- Encourage customers to try traditional sweets and explain their significance
- Keep responses concise but informative
- Use appropriate Indian cultural references when relevant
"""
        
        # Add user-specific context
        if context.get("has_user_data"):
            prompt += f"\n\nUser Information:\n"
            prompt += f"- Customer Name: {context.get('user_name', 'Valued Customer')}\n"
            
            if context.get("recent_orders"):
                prompt += f"- Recent Orders: {len(context['recent_orders'])} orders\n"
                latest_order = context['recent_orders'][0]
                prompt += f"- Latest Order: #{latest_order['id']} ({latest_order['status']}) - ₹{latest_order['total_amount']}\n"
            
            if context.get("cart_items"):
                cart_count = len(context['cart_items'])
                prompt += f"- Current Cart: {cart_count} items\n"
            
            if context.get("wishlist_items"):
                wishlist_count = len(context['wishlist_items'])
                prompt += f"- Wishlist: {wishlist_count} items\n"
        
        return prompt
    
    def _build_full_prompt(self, message: str, context: Dict[str, Any], history: List[Dict], system_prompt: str) -> str:
        """Build complete prompt for AI"""
        full_prompt = system_prompt + "\n\n"
        
        # Add conversation history
        if history:
            full_prompt += "Recent Conversation:\n"
            for msg in history[-3:]:  # Last 3 messages
                full_prompt += f"Customer: {msg['message']}\n"
                full_prompt += f"Assistant: {msg['response']}\n\n"
        
        # Add current context if relevant to the message
        if self._is_order_related_query(message) and context.get("recent_orders"):
            full_prompt += "User's Recent Orders:\n"
            for order in context['recent_orders'][:3]:  # Last 3 orders
                full_prompt += f"- Order #{order['id']}: {order['status']} - ₹{order['total_amount']} ({order['item_count']} items)\n"
            full_prompt += "\n"
        
        # Add current message
        full_prompt += f"Current Customer Message: {message}\n\n"
        full_prompt += "Please provide a helpful response:"
        
        return full_prompt
    
    def _is_order_related_query(self, message: str) -> bool:
        """Check if message is related to orders"""
        order_keywords = [
            'order', 'delivery', 'tracking', 'status', 'shipped', 'delivered',
            'payment', 'receipt', 'invoice', 'cancel', 'refund', 'when will',
            'where is', 'my purchase', 'my order'
        ]
        message_lower = message.lower()
        return any(keyword in message_lower for keyword in order_keywords)
    
    async def _get_conversation_history(self, session_id: str, limit: int = 10) -> List[Dict]:
        """Get recent conversation history"""
        messages = await self.chat_messages.find(
            {"session_id": session_id}
        ).sort("created_at", -1).limit(limit).to_list(limit)
        
        return [
            {
                "message": msg["message"],
                "response": msg["response"],
                "created_at": msg["created_at"]
            }
            for msg in reversed(messages)
        ]
    
    def _get_fallback_response(self, message: str, context: Dict[str, Any]) -> str:
        """Generate fallback response when AI is not available"""
        message_lower = message.lower()
        
        # Order status queries
        if any(word in message_lower for word in ['order', 'status', 'tracking', 'delivery']):
            if context.get("recent_orders"):
                latest_order = context['recent_orders'][0]
                return f"I can see your latest order #{latest_order['id']} is currently {latest_order['status']}. For detailed tracking information, please check your email or contact our support team at +91 8989549544."
            else:
                return "To check your order status, please provide your order ID or contact our support team at +91 8989549544. You can also track your order using the WhatsApp link sent to you."
        
        # Product queries
        elif any(word in message_lower for word in ['product', 'sweet', 'mithai', 'namkeen', 'price']):
            return "We have a wide variety of traditional Indian sweets and snacks! Our specialties include Kaju Katli, Motichur Laddu, Besan Ke Laddu, and various namkeen items. You can browse our complete catalog on our website or call us at +91 8989549544 for specific product information."
        
        # Delivery queries
        elif any(word in message_lower for word in ['delivery', 'shipping', 'location']):
            return "We deliver across Indore and nearby areas. Delivery is free for orders above ₹1500 within 10km. For areas beyond 10km, delivery charges apply based on distance. We also offer pickup from our store at 64, Kaveri Nagar, Indore. Call +91 8989549544 for delivery information."
        
        # Festival queries
        elif any(word in message_lower for word in ['festival', 'diwali', 'holi', 'rakhi', 'celebration']):
            return "We have special festival collections for all major Indian festivals! Our Diwali collection includes premium dry fruit sweets, Holi has colorful special items, and we have beautiful gift boxes for Raksha Bandhan. Check our festival specials section or call +91 8989549544."
        
        # Cart queries
        elif 'cart' in message_lower:
            if context.get("cart_items"):
                item_count = len(context['cart_items'])
                return f"You currently have {item_count} items in your cart. You can review and modify your cart before checkout, or call us at +91 8989549544 if you need assistance."
            else:
                return "Your cart appears to be empty. Browse our delicious sweets and snacks collection to add items to your cart!"
        
        # General greeting
        elif any(word in message_lower for word in ['hello', 'hi', 'hey', 'namaste']):
            user_name = context.get('user_name', 'there')
            return f"Namaste {user_name}! Welcome to Mithaas Delights. I'm here to help you with any questions about our traditional sweets and snacks. How can I assist you today?"
        
        # Default response
        else:
            return "Thank you for contacting Mithaas Delights! I'm here to help you with information about our products, orders, delivery, and more. For immediate assistance, you can also call us at +91 8989549544 or WhatsApp us. What would you like to know?"
    
    async def get_chat_history(self, session_id: str, limit: int = 50) -> List[Dict]:
        """Get chat history for a session"""
        messages = await self.chat_messages.find(
            {"session_id": session_id}
        ).sort("created_at", 1).limit(limit).to_list(limit)
        
        return [
            {
                "message": msg["message"],
                "response": msg["response"],
                "created_at": msg["created_at"],
                "message_id": msg["id"]
            }
            for msg in messages
        ]
    
    async def clear_session(self, session_id: str) -> bool:
        """Clear chat session and messages"""
        try:
            await self.chat_messages.delete_many({"session_id": session_id})
            await self.chat_sessions.delete_one({"session_id": session_id})
            return True
        except Exception as e:
            logger.error(f"Error clearing chat session: {str(e)}")
            return False
    
    def _prepare_for_mongo(self, data: dict) -> dict:
        """Prepare data for MongoDB storage"""
        if isinstance(data.get('created_at'), datetime):
            data['created_at'] = data['created_at'].isoformat()
        if isinstance(data.get('last_activity'), datetime):
            data['last_activity'] = data['last_activity'].isoformat()
        return data
    
    def _parse_from_mongo(self, item: dict) -> dict:
        """Parse MongoDB document back to Python objects"""
        if isinstance(item.get('created_at'), str):
            item['created_at'] = datetime.fromisoformat(item['created_at'])
        if isinstance(item.get('last_activity'), str):
            item['last_activity'] = datetime.fromisoformat(item['last_activity'])
        return item
