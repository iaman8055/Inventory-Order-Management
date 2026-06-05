from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DATABASE_URL: str

    # Modern Pydantic v2 configuration style
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()