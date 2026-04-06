class SolmindError(Exception):
    pass


class AuthenticationError(SolmindError):
    pass


class SolmindRuntimeError(SolmindError):
    pass

