import { useContext } from "react";
import { ToastContext } from "../contexts/toastcontext/toast-context";

export const useToast = ()=> useContext(ToastContext)