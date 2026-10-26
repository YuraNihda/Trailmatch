class DomainError(Exception):
    status_code = 400
    code = "domain_error"

    def __init__(self, message: str):
        super().__init__(message)
        self.message = message


class NotFound(DomainError):
    status_code, code = 404, "not_found"


class Conflict(DomainError):
    status_code, code = 409, "conflict"


class Forbidden(DomainError):
    status_code, code = 403, "forbidden"


class Unauthorized(DomainError):
    status_code, code = 401, "unauthorized"


class BusinessRuleViolation(DomainError):
    status_code, code = 422, "business_rule_violation"


class FeatureUnavailable(DomainError):
    """Feature depends on an integration that is not configured (HTTP 501)."""
    status_code, code = 501, "feature_unavailable"


class UpstreamUnavailable(DomainError):
    """An external module (e.g. ML) failed; core features keep working (HTTP 503)."""
    status_code, code = 503, "upstream_unavailable"
