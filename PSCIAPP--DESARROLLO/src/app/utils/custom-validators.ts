import { AbstractControl } from "@angular/forms";

export class CustomValidators{

    static noWhiteSpace(control: AbstractControl){
        const isWhiteSpace = (control.value || '').trim().length === 0;
        return !isWhiteSpace ? null : { 'whitespace': true }
    }
}