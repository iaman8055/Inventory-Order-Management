from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DATABASE_URL: str

    # Clean & Direct: Since you run uvicorn from the backend/ directory, 
    # it looks for '.env' right there.
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()