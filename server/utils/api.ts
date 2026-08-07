import {ZodError} from 'zod'
export const ok=<T>(data:T)=>({success:true,data})
export function validationError(error:unknown):never{if(error instanceof ZodError)throw createError({statusCode:422,statusMessage:'Gönderilen bilgiler geçersiz.',data:{success:false,error:{code:'VALIDATION_ERROR',message:'Gönderilen bilgiler geçersiz.',fields:error.flatten().fieldErrors}}});throw error}
