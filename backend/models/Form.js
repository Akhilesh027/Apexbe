import mongoose from "mongoose";

const formSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    message: { type: String },
    formType: { type: String, required: true }, // to know which button submitted
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Form = mongoose.model("Form", formSchema);
export default Form;
