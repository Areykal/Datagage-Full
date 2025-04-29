/**
 * Validates source creation requests
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @param {Function} next - The next middleware function
 */
const validateSourceCreation = (req, res, next) => {
  const { sourceName, sourceType, sourceConfig } = req.body;
  
  // Validate all required fields with specific error messages
  if (!sourceName) {
    return res.status(400).json({
      error: "Source name is required",
      field: "sourceName"
    });
  }
  
  if (!sourceType) {
    return res.status(400).json({
      error: "Source type is required",
      field: "sourceType"
    });
  }
  
  if (!sourceConfig) {
    return res.status(400).json({
      error: "Source configuration is required",
      field: "sourceConfig"
    });
  }
  
  // If source config is a string (e.g., from FormData), parse it
  if (typeof sourceConfig === 'string') {
    try {
      req.body.sourceConfig = JSON.parse(sourceConfig);
    } catch (err) {
      return res.status(400).json({
        error: "Invalid source configuration JSON format",
        field: "sourceConfig"
      });
    }
  }
  
  // All validations passed
  next();
};

export { validateSourceCreation };
