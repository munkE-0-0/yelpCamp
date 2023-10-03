const express = require('express');
const app=express();
const path=require("path");
const methodOverride=require("method-override")
const mongoose = require('mongoose');
const Campground = require('./models/campgrounds');
const ejsMate=require('ejs-mate');
const catchAsync=require("./utils/catchAsync")
const ExpressError=require("./utils/expresError")
const joi=require("joi")
const {campgroundSchema,ratingSchema}=require("./schema.js")

const Review=require("./models/review");


app.use(express.urlencoded({extended:true}))
app.use(express.json());
app.use(methodOverride('_method'))
app.engine('ejs',ejsMate);
app.set("view engine",'ejs');

app.set('views',path.join(__dirname,'views'))





const validateCampground = (req, res, next) => {
  const { error } = campgroundSchema.validate(req.body.campground);
  if (error) {
    const msg = error.details.map(el => el.message).join(",");
    throw new ExpressError(msg, 400);
  } else {
    next();
  }
}

const validateReview=(req,res,next)=>{
  const {error}=ratingSchema.validate(req.body.review);

  if(error){
    const msg=error.details.map(el=>el.message).join(",");
  }else{
    next();
  }
}

const port = 8080

main().catch(err => console.log(err));

async function main() {
    await mongoose.connect("mongodb://127.0.0.1:27017/yelp-camp");
    console.log("Connection open!");
};


app.get('/',(req,res)=>{
  const currentUser={username:'Dhanush'}
  res.render("home",{currentUser})

})


app.get("/campgrounds", catchAsync(async(req,res)=>{
  const campgrounds= await Campground.find({})
 
  res.render("campgrounds/index",{campgrounds:campgrounds})
}))


app.get("/campgrounds/new",(req,res)=>{
  res.render("campgrounds/new")
})

app.post("/campgrounds", validateCampground,catchAsync(async(req,res)=>{
  // if(!req.body.campground){throw new ExpressError("Not Enough Campground Data",400)}
  const campground=new Campground(req.body.campground);
  await campground.save();
  res.redirect(`/campgrounds/${campground._id}`)
}))



app.get("/campgrounds/:id",catchAsync(async (req,res)=>{
  const campground=await Campground.findById(req.params.id).populate('reviews');
  
  res.render("campgrounds/show",{campground})
}))

app.delete("/campgrounds/:id",async (req,res)=>{
  const {id}=req.params;
  await Campground.findByIdAndDelete(id);
  res.redirect("/campgrounds")
})


app.get("/campgrounds/:id/edit",catchAsync(async(req,res)=>{

  const campground= await Campground.findById(req.params.id)
  
    res.render("campgrounds/edit",{campground}) 
}))

app.put("/campgrounds/:id",catchAsync(async(req,res)=>{
  const prevCampground=await Campground.findByIdAndUpdate(req.params.id,req.body.campground);
  res.redirect(`/campgrounds/${prevCampground._id}`);
}))


app.post("/campgrounds/:id/review",catchAsync(async(req,res)=>{
  const campground=await Campground.findById(req.params.id);
  const review=new Review(req.body.review);
  campground.reviews.push(review)
  await review.save()
  await campground.save()
  res.redirect(`/campgrounds/${campground._id}`)
}))


app.delete("/campgrounds/:id/reviews/:reviewId",catchAsync(async (req,res)=>{
  const {id,reviewId}=req.params;
  await Campground.findByIdAndUpdate(id,{$pull:{reviews: reviewId}});
  await Review.findByIdAndDelete(reviewId);
  res.redirect(`/campgrounds/${id}`);
}))


app.all("*",(req,res,next)=>{
  next(new ExpressError("Page Not Found",404))
})

app.use((err,req,res,next)=>{
  const {statusCode=500}=err;
  if(!err.message){err.message="Oh no something went wrong!!!"}
  res.status(statusCode).render("error",{err});
 
})

app.listen(port, () => {
    console.log(`App is listening on port: ${port}`);
});



