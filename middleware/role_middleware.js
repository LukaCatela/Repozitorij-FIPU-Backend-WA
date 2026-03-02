// ovaj middleware pregledava ako odredeni user ima pristup resursu

export default function roleMiddleware(...dopusteneRole) {
  return (req, res, next) => {
    if (!dopusteneRole.includes(req.user.role))
      return res.status(403).json({ error: "Nemate pristup" });
    next();
  };
}
