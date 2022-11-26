module.exports = function(required = []) {
    return function(req, res, next){
        var missing_params = []
        required.forEach((param) => {
            if (req.body[param] == null) {
                missing_params.push(param)
            }
        })
        if (missing_params.length > 0) {
            res.status(400).json({message: "Missing parameters: " + missing_params.join(", ")})
            return
        }
        next()
    }
}