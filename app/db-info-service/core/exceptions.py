class EngineNotFoundError(Exception):
    """Exception raised when a database engine type is not found."""
    pass


class InvalidPresetError(Exception):
    """Exception raised when a requested resource preset is invalid."""
    pass


class VersionNotSupportedError(Exception):
    """Exception raised when requested engine version is not supported."""
    pass
