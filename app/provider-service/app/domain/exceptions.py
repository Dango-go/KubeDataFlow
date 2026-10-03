class ProviderError(Exception):
    pass


class InvalidCredentials(ProviderError):
    pass


class AccountAlreadyExists(ProviderError):
    pass
