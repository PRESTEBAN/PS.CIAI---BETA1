// openai.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { tap } from 'rxjs';
import { UserService } from '../services/user.service';

@Injectable({
  providedIn: 'root'
})
export class OpenaiService {
  constructor(
    private http: HttpClient,
    private userService: UserService
  ) { }

  sendQuestion(promt: string, userId: string) {
    console.log('User ID from OpenaiService:', userId);  // Añade esta línea para depurar
    return this.http.post(environment.baseUrl, { promt, userId }).pipe(
      tap((response: any) => {
        this.userService.saveUserMessage(userId, promt, response.bot.content);
      })
    );
  }
}
