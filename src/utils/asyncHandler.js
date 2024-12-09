const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};

export {asyncHandler};

//? const asyncHandler = () => {}
//? const asyncHandler = () => {() => {}}
//? const asynshandler = () => () => {}

// ?Another mothod
/*  
const asyncHandler = (requstHandler) => 
    async (req,res,next) => {
        try{
        await requstHandler(req,res,next);
        } catch(err){
        res.status( err.code || 500).json({
        success:true,
        message:err.message
        }); 
    }
}
*/
