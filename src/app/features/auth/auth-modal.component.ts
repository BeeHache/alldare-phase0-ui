import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-auth-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './auth-modal.component.html',
  styleUrls: ['./auth-modal.component.scss']
})
export class AuthModalComponent {
  private authService = inject(AuthService);

  @Output() closeModal = new EventEmitter<void>();

  loginWithGitHub(): void {
    this.authService.loginWithGitHub();
  }

  loginWithGoogle(): void {
    this.authService.loginWithGoogle();
  }

  close(): void {
    this.closeModal.emit();
  }
}
