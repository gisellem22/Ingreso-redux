import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore } from '@angular/fire/firestore';
import { Store } from '@ngrx/store';
import { map } from 'rxjs/operators';
import { AppState } from '../app.reducer';
import { Usuario } from '../models/usuario.model';
import * as authActions from '../auth/auth.actions';
import { Subscription } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  userSubscription: Subscription;

  constructor(
    public auth: AngularFireAuth,
    private firestore: AngularFirestore,
    private store: Store<AppState>
  ) {}

  initAuthListener() {
    this.auth.authState.subscribe((fbUser) => {
      if (fbUser) {
        this.userSubscription = this.firestore
          .doc(`${fbUser.uid}/usuario`)
          .valueChanges()
          .subscribe((firestoreUser: Usuario) => {
            const user: Usuario = {
              nombre: firestoreUser.nombre,
              uid: firestoreUser.uid,
              email: firestoreUser.email,
            };
            this.store.dispatch(authActions.setUser({ user }));
          });
      } else {
        this.userSubscription.unsubscribe();
        this.store.dispatch(authActions.unsetUser());
      }
    });
  }

  crearUsuario(nombre: string, email: string, password: string) {
    return this.auth
      .createUserWithEmailAndPassword(email, password)
      .then(({ user }) => {
        const newUser: Usuario = {
          nombre,
          uid: user.uid,
          email: user.email,
        };
        return this.firestore.doc(`${user.uid}/usuario`).set(newUser);
      });
  }

  loginUsuario(email: string, password: string) {
    console.log(email, password);

    return this.auth.signInWithEmailAndPassword(email, password);
  }

  logout() {
    return this.auth.signOut();
  }

  isAuth() {
    return this.auth.authState.pipe(map((fbUser) => fbUser != null));
  }
}
