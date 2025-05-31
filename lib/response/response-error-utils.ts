type TArg = string;
type TArgs = TArg | [TArg, Record<string, unknown>];

type TTranslateableString = TArg | TArgs;

export type TResponseDataWithErrors = {
  _errors?: {
    formErrors: TTranslateableString[];
    fieldErrors: Record<string, TTranslateableString[]>;
  };
};

export function hasFormError<UResponseData extends TResponseDataWithErrors>(
  errorKey: string,
  responseData?: UResponseData
): boolean {
  if (!responseData || !responseData._errors) {
    return false;
  }

  return responseData._errors.formErrors.some(function isInputErrorKey(error) {
    if (typeof error === 'string') {
      return error === errorKey;
    }

    if (Array.isArray(error)) {
      return error[0] === errorKey;
    }

    return false;
  });
}

export function hasAnyFormError<UResponseData extends TResponseDataWithErrors>(
  responseData?: UResponseData
): boolean {
  if (!responseData || !responseData._errors) {
    return false;
  }

  return responseData._errors.formErrors.length > 0;
}
