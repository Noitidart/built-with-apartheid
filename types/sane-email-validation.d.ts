declare module 'sane-email-validation' {
  function isEmail(email: string): boolean;
  export default isEmail;
  
  export function isAsciiEmail(email: string): boolean;
  export function isNotEmail(email: string): boolean;
  export function isNotAsciiEmail(email: string): boolean;
}