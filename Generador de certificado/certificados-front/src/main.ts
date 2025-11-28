import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideHttpClient, withFetch } from '@angular/common/http';

bootstrapApplication(AppComponent, {
  providers: [
     provideHttpClient(withFetch()) // ✅ La forma correcta en standalone
  ],
}).catch(err => console.error(err));
