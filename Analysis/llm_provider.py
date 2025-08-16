import os
import json
import logging
from typing import Dict, List, Optional, Union, Any

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class LLMProvider:
    """Base class for LLM providers that can be used with DSPy agents."""
    
    def __init__(self, api_key: Optional[str] = None, model: str = "default"):
        """
        Initialize the LLM provider.
        
        Args:
            api_key: API key for the provider. If None, will try to get from environment.
            model: Model name to use.
        """
        self.api_key = api_key or os.environ.get(self._get_api_key_env_var())
        if not self.api_key:
            logger.warning(f"No API key provided for {self.__class__.__name__}. Some functionality may be limited.")
        
        self.model = model
    
    def _get_api_key_env_var(self) -> str:
        """Get the environment variable name for the API key."""
        raise NotImplementedError("Subclasses must implement this method")
    
    async def generate(self, prompt: str, **kwargs) -> str:
        """
        Generate text from a prompt.
        
        Args:
            prompt: The prompt to generate from.
            **kwargs: Additional arguments to pass to the provider.
            
        Returns:
            The generated text.
        """
        raise NotImplementedError("Subclasses must implement this method")
    
    async def generate_with_context(self, 
                                   prompt: str, 
                                   context: List[Dict[str, str]], 
                                   **kwargs) -> str:
        """
        Generate text from a prompt with conversation context.
        
        Args:
            prompt: The prompt to generate from.
            context: List of previous messages in the conversation.
            **kwargs: Additional arguments to pass to the provider.
            
        Returns:
            The generated text.
        """
        raise NotImplementedError("Subclasses must implement this method")
    
    async def embed(self, text: str, **kwargs) -> List[float]:
        """
        Get embeddings for text.
        
        Args:
            text: The text to embed.
            **kwargs: Additional arguments to pass to the provider.
            
        Returns:
            The embedding as a list of floats.
        """
        raise NotImplementedError("Subclasses must implement this method")


class OpenAIProvider(LLMProvider):
    """OpenAI API provider for LLM functionality."""
    
    def __init__(self, api_key: Optional[str] = None, model: str = "gpt-4-turbo"):
        """
        Initialize the OpenAI provider.
        
        Args:
            api_key: OpenAI API key. If None, will try to get from environment.
            model: Model name to use. Defaults to gpt-4-turbo.
        """
        super().__init__(api_key, model)
        # We'll use requests instead of the OpenAI client to avoid dependencies
        self.api_base = "https://api.openai.com/v1"
    
    def _get_api_key_env_var(self) -> str:
        return "OPENAI_API_KEY"
    
    async def generate(self, prompt: str, **kwargs) -> str:
        """
        Generate text using OpenAI API.
        
        Args:
            prompt: The prompt to generate from.
            **kwargs: Additional arguments to pass to the API.
            
        Returns:
            The generated text.
        """
        import requests
        
        temperature = kwargs.get('temperature', 0.7)
        max_tokens = kwargs.get('max_tokens', 1000)
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }
        
        data = {
            "model": self.model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": temperature,
            "max_tokens": max_tokens
        }
        
        response = requests.post(
            f"{self.api_base}/chat/completions",
            headers=headers,
            json=data
        )
        
        if response.status_code != 200:
            logger.error(f"Error from OpenAI API: {response.text}")
            raise Exception(f"OpenAI API error: {response.status_code}")
        
        result = response.json()
        return result["choices"][0]["message"]["content"]
    
    async def generate_with_context(self, 
                                   prompt: str, 
                                   context: List[Dict[str, str]], 
                                   **kwargs) -> str:
        """
        Generate text using OpenAI API with conversation context.
        
        Args:
            prompt: The prompt to generate from.
            context: List of previous messages in the conversation.
            **kwargs: Additional arguments to pass to the API.
            
        Returns:
            The generated text.
        """
        import requests
        
        temperature = kwargs.get('temperature', 0.7)
        max_tokens = kwargs.get('max_tokens', 1000)
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }
        
        messages = [{"role": m.get("role", "user"), "content": m.get("content")} for m in context]
        messages.append({"role": "user", "content": prompt})
        
        data = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens
        }
        
        response = requests.post(
            f"{self.api_base}/chat/completions",
            headers=headers,
            json=data
        )
        
        if response.status_code != 200:
            logger.error(f"Error from OpenAI API: {response.text}")
            raise Exception(f"OpenAI API error: {response.status_code}")
        
        result = response.json()
        return result["choices"][0]["message"]["content"]
    
    async def embed(self, text: str, **kwargs) -> List[float]:
        """
        Get embeddings using OpenAI API.
        
        Args:
            text: The text to embed.
            **kwargs: Additional arguments to pass to the API.
            
        Returns:
            The embedding as a list of floats.
        """
        import requests
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }
        
        data = {
            "model": "text-embedding-3-small",
            "input": text
        }
        
        response = requests.post(
            f"{self.api_base}/embeddings",
            headers=headers,
            json=data
        )
        
        if response.status_code != 200:
            logger.error(f"Error from OpenAI API: {response.text}")
            raise Exception(f"OpenAI API error: {response.status_code}")
        
        result = response.json()
        return result["data"][0]["embedding"]


class AnthropicProvider(LLMProvider):
    """Anthropic API provider for LLM functionality."""
    
    def __init__(self, api_key: Optional[str] = None, model: str = "claude-3-opus-20240229"):
        """
        Initialize the Anthropic provider.
        
        Args:
            api_key: Anthropic API key. If None, will try to get from environment.
            model: Model name to use. Defaults to claude-3-opus.
        """
        super().__init__(api_key, model)
        self.api_base = "https://api.anthropic.com/v1"
    
    def _get_api_key_env_var(self) -> str:
        return "ANTHROPIC_API_KEY"
    
    async def generate(self, prompt: str, **kwargs) -> str:
        """
        Generate text using Anthropic API.
        
        Args:
            prompt: The prompt to generate from.
            **kwargs: Additional arguments to pass to the API.
            
        Returns:
            The generated text.
        """
        import requests
        
        temperature = kwargs.get('temperature', 0.7)
        max_tokens = kwargs.get('max_tokens', 1000)
        
        headers = {
            "Content-Type": "application/json",
            "x-api-key": self.api_key,
            "anthropic-version": "2023-06-01"
        }
        
        data = {
            "model": self.model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": temperature,
            "max_tokens": max_tokens
        }
        
        response = requests.post(
            f"{self.api_base}/messages",
            headers=headers,
            json=data
        )
        
        if response.status_code != 200:
            logger.error(f"Error from Anthropic API: {response.text}")
            raise Exception(f"Anthropic API error: {response.status_code}")
        
        result = response.json()
        return result["content"][0]["text"]
    
    async def generate_with_context(self, 
                                   prompt: str, 
                                   context: List[Dict[str, str]], 
                                   **kwargs) -> str:
        """
        Generate text using Anthropic API with conversation context.
        
        Args:
            prompt: The prompt to generate from.
            context: List of previous messages in the conversation.
            **kwargs: Additional arguments to pass to the API.
            
        Returns:
            The generated text.
        """
        import requests
        
        temperature = kwargs.get('temperature', 0.7)
        max_tokens = kwargs.get('max_tokens', 1000)
        
        headers = {
            "Content-Type": "application/json",
            "x-api-key": self.api_key,
            "anthropic-version": "2023-06-01"
        }
        
        messages = [{"role": m.get("role", "user"), "content": m.get("content")} for m in context]
        messages.append({"role": "user", "content": prompt})
        
        data = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens
        }
        
        response = requests.post(
            f"{self.api_base}/messages",
            headers=headers,
            json=data
        )
        
        if response.status_code != 200:
            logger.error(f"Error from Anthropic API: {response.text}")
            raise Exception(f"Anthropic API error: {response.status_code}")
        
        result = response.json()
        return result["content"][0]["text"]
    
    async def embed(self, text: str, **kwargs) -> List[float]:
        """
        Get embeddings using a third-party API since Anthropic doesn't provide embeddings.
        Falls back to OpenAI embeddings.
        
        Args:
            text: The text to embed.
            **kwargs: Additional arguments to pass to the API.
            
        Returns:
            The embedding as a list of floats.
        """
        # Fallback to OpenAI embeddings
        openai_provider = OpenAIProvider(os.environ.get("OPENAI_API_KEY"))
        return await openai_provider.embed(text, **kwargs)


class MistralProvider(LLMProvider):
    """Mistral API provider for LLM functionality."""
    
    def __init__(self, api_key: Optional[str] = None, model: str = "mistral-large-latest"):
        """
        Initialize the Mistral provider.
        
        Args:
            api_key: Mistral API key. If None, will try to get from environment.
            model: Model name to use. Defaults to mistral-large-latest.
        """
        super().__init__(api_key, model)
        self.api_base = "https://api.mistral.ai/v1"
    
    def _get_api_key_env_var(self) -> str:
        return "MISTRAL_API_KEY"
    
    async def generate(self, prompt: str, **kwargs) -> str:
        """
        Generate text using Mistral API.
        
        Args:
            prompt: The prompt to generate from.
            **kwargs: Additional arguments to pass to the API.
            
        Returns:
            The generated text.
        """
        import requests
        
        temperature = kwargs.get('temperature', 0.7)
        max_tokens = kwargs.get('max_tokens', 1000)
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }
        
        data = {
            "model": self.model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": temperature,
            "max_tokens": max_tokens
        }
        
        response = requests.post(
            f"{self.api_base}/chat/completions",
            headers=headers,
            json=data
        )
        
        if response.status_code != 200:
            logger.error(f"Error from Mistral API: {response.text}")
            raise Exception(f"Mistral API error: {response.status_code}")
        
        result = response.json()
        return result["choices"][0]["message"]["content"]
    
    async def generate_with_context(self, 
                                   prompt: str, 
                                   context: List[Dict[str, str]], 
                                   **kwargs) -> str:
        """
        Generate text using Mistral API with conversation context.
        
        Args:
            prompt: The prompt to generate from.
            context: List of previous messages in the conversation.
            **kwargs: Additional arguments to pass to the API.
            
        Returns:
            The generated text.
        """
        import requests
        
        temperature = kwargs.get('temperature', 0.7)
        max_tokens = kwargs.get('max_tokens', 1000)
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }
        
        messages = [{"role": m.get("role", "user"), "content": m.get("content")} for m in context]
        messages.append({"role": "user", "content": prompt})
        
        data = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens
        }
        
        response = requests.post(
            f"{self.api_base}/chat/completions",
            headers=headers,
            json=data
        )
        
        if response.status_code != 200:
            logger.error(f"Error from Mistral API: {response.text}")
            raise Exception(f"Mistral API error: {response.status_code}")
        
        result = response.json()
        return result["choices"][0]["message"]["content"]
    
    async def embed(self, text: str, **kwargs) -> List[float]:
        """
        Get embeddings using Mistral API.
        
        Args:
            text: The text to embed.
            **kwargs: Additional arguments to pass to the API.
            
        Returns:
            The embedding as a list of floats.
        """
        import requests
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }
        
        data = {
            "model": "mistral-embed",
            "input": text
        }
        
        response = requests.post(
            f"{self.api_base}/embeddings",
            headers=headers,
            json=data
        )
        
        if response.status_code != 200:
            logger.error(f"Error from Mistral API: {response.text}")
            raise Exception(f"Mistral API error: {response.status_code}")
        
        result = response.json()
        return result["data"][0]["embedding"]


class OllamaProvider(LLMProvider):
    """Ollama API provider for local LLM functionality."""
    
    def __init__(self, api_base: str = "http://localhost:11434", mode
(Content truncated due to size limit. Use line ranges to read in chunks)