import { Component, OnInit } from '@angular/core';
import { UserService } from 'src/app/services/user.service';
import { FormControl, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent  implements OnInit {

  formReg: FormGroup;

  constructor(
    private userService: UserService,
    private router: Router
  ) {
    this.formReg = new FormGroup({
      email: new FormControl(),
      password: new FormControl()
    })
  }

  ngOnInit(): void {
    
  }

  onSubmit() {
    if (this.userService.getUserId()) {
      this.userService.register(this.formReg.value)
        .then(response => {
          console.log(response);
          this.router.navigate(['/chat']);
          console.error('Usuario  autenticado.');
        })
        .catch(error => console.log(error));
    } else {
      console.error('Usuario no autenticado.');
    }
  }

}
