export interface FormField {
  id:       string;
  type:     string;
  label:    string;
  required: boolean;
  order:    number;
  [key: string]: unknown;
}

export interface FormContent {
  fields:  FormField[];
  version: number;
  [key: string]: unknown;
}

function makeTextField(order: number): FormField {
  return {
    id:          `field_textbox_${order}`,
    type:        'TEXT',              
    label:       'Full Name',
    placeholder: 'Enter your full name',
    required:    true,
    order,
  };
}

function makeTextAreaField(order: number): FormField {
  return {
    id:          `field_textarea_${order}`,
    type:        'TEXTAREA',          
    label:       'Description',
    placeholder: 'Enter a description',
    required:    false,
    order,
  };
}

function makeNumberField(order: number): FormField {
  return {
    id:          `field_number_${order}`,
    type:        'NUMBER',
    label:       'Age',
    placeholder: 'Enter a number',
    required:    false,
    order,
  };
}

export function buildFormContent(fileId: string): FormContent {
  return {
    fileId,
    version: 1,
    fields: [
      makeTextField(1),
      makeTextAreaField(2),
      makeNumberField(3),
    ],
  };
}

export function buildFormDependencies(fileId: string): object {
  return {
    fileId,
    dependencies: [],
  };
}
