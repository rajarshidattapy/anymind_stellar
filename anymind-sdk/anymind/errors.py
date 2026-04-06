class AnymindError(Exception):
    pass


class AuthenticationError(AnymindError):
    pass


class AnymindRuntimeError(AnymindError):
    pass

