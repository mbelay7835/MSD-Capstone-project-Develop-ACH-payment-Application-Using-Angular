import {
    Pipe,
    PipeTransform
} from '@angular/core';

@Pipe({
    name: 'bold'
})
export class BoldPipe implements PipeTransform {
    transform(value: string): any {

        const message = '<strong>' + value + '</strong>';
        return message
    }
}