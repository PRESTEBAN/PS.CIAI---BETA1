import { Component, OnInit } from '@angular/core';
import { UserService } from './../services/user.service';
import { Router } from '@angular/router';


@Component({
  selector: 'app-principal',
  templateUrl: './principal.page.html',
  styleUrls: ['./principal.page.scss'],
})
export class PrincipalPage implements OnInit {
  
  nombreUsuario: string = '';
  constructor( private userService: UserService, private router: Router) { }

  ngOnInit() {
    this.nombreUsuario = this.userService.getUserName();
  }

  irChat(){
    this.router.navigate(['/chat']);
  }

  irPrincipal(){
    this.router.navigate(['/Principal']);
  }

}
