import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class SharedServiceService {
  private selectedCardImageUrlSource = new BehaviorSubject<string>('');
  selectedCardImageUrl$ = this.selectedCardImageUrlSource.asObservable();

  updateSelectedCardImageUrl(url: string) {
    this.selectedCardImageUrlSource.next(url);
  }

  constructor() { }
}
