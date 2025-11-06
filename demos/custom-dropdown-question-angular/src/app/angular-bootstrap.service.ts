import { NgModuleRef, ComponentRef, createComponent, EnvironmentInjector } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app.module';
import { TemplateRendererComponent } from './components/template-renderer/template-renderer.component';
import { TestRendererComponent } from './components/test-renderer/test-renderer.component';

export class AngularBootstrapService {
  private static moduleRef: NgModuleRef<AppModule> | null = null;
  private static isBootstrapped = false;
  private static angularRootElement: HTMLElement | null = null;

  static async bootstrap(): Promise<NgModuleRef<AppModule>> {
    if (this.isBootstrapped && this.moduleRef) {
      return this.moduleRef;
    }

    try {
      // Create the Angular root element that matches our app-root selector
      if (!this.angularRootElement) {
        this.angularRootElement = document.createElement('app-root');
        this.angularRootElement.style.display = 'none';
        this.angularRootElement.style.position = 'absolute';
        this.angularRootElement.style.top = '-9999px';
        document.body.appendChild(this.angularRootElement);
      }

      this.moduleRef = await platformBrowserDynamic().bootstrapModule(AppModule, {
        ngZoneEventCoalescing: true
      });
      this.isBootstrapped = true;
      console.log('Angular application bootstrapped successfully');
      
      if (!this.moduleRef) {
        throw new Error('Failed to bootstrap Angular module');
      }
      
      return this.moduleRef;
    } catch (error) {
      console.error('Error bootstrapping Angular application:', error);
      throw error;
    }
  }

  static async createTemplateRendererComponent(
    hostElement: HTMLElement,
    moduleRef: NgModuleRef<AppModule>
  ): Promise<ComponentRef<TemplateRendererComponent>> {
    try {
      // Use the module's injector directly - it contains all the providers
      const componentRef = createComponent(TemplateRendererComponent, {
        environmentInjector: moduleRef.injector,
        hostElement
      });

      return componentRef;
    } catch (error) {
      console.error('Error creating TemplateRendererComponent:', error);
      throw error;
    }
  }

  static destroy(): void {
    if (this.moduleRef) {
      this.moduleRef.destroy();
      this.moduleRef = null;
      this.isBootstrapped = false;
    }

    if (this.angularRootElement && this.angularRootElement.parentNode) {
      this.angularRootElement.parentNode.removeChild(this.angularRootElement);
      this.angularRootElement = null;
    }
  }
}
