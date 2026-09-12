/**
 * HireScope — Auth Middleware
 *
 * Session cookie auth (httpOnly, secure in prod).
 * Enforces req.session.userId on protected routes.
 */

export function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({
      code: "UNAUTHORIZED",
      message: "Authentication required. Please log in.",
    });
  }
  next();
}

/**
 * Kit ownership middleware — checks that the kit belongs to the current user.
 * Attach after requireAuth.
 */
export function requireKitOwnership(kitRepository) {
  return async (req, res, next) => {
    const { id } = req.params;
    const userId = req.session.userId;

    const kit = await kitRepository.findByIdForUser(id, userId);
    if (!kit) {
      return res.status(404).json({
        code: "NOT_FOUND",
        message: "Kit not found or you don't have access.",
      });
    }

    // Attach kit to request for downstream use
    req.kit = kit;
    next();
  };
}
