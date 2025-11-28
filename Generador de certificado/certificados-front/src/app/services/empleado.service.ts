import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Cargo, TipoContrato, Eps, Arl, FondoPensiones, CajaCompensacion, TipoRetiro } from './empleado.enums';

export interface Empleado {
  [key: string]: any; 
  id?: number;
  nombre: string;
  apellido: string;
  cedula: string;
  salario: number | null;
  fondoPensiones: FondoPensiones | null;
  cargo: Cargo | null;
  eps: Eps | null;
  arl: Arl | null;
  cajaCompensacion: CajaCompensacion | null;
  fechaInicio: string;
  correo: string;
  tipoContrato: TipoContrato | null;
  tipoRetiro: TipoRetiro | null;
  fechaRetiro: string;
  activo?: boolean;
}

export interface TipoCertificado {
  codigo: string;
  descripcion: string;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

@Injectable({ providedIn: 'root' })
export class EmpleadoService {
  private readonly baseUrl = 'http://localhost:8080/empleado';

  constructor(private http: HttpClient) {}

 obtenerPaginado(
  page: number,
  size: number,
  campoFiltro?: string,
  valorFiltro?: string,
  estadoActivo?: boolean | null
): Observable<PaginatedResponse<Empleado>> {
  let params = new HttpParams()
    .set('page', page.toString())
    .set('size', size.toString());

  if (campoFiltro) {
    params = params.set('campoFiltro', campoFiltro);
  }
  if (valorFiltro) {
    params = params.set('valorFiltro', valorFiltro);
  }
  if (estadoActivo !== undefined && estadoActivo !== null) {
    params = params.set('estadoActivo', estadoActivo.toString());
  }

  return this.http.get<PaginatedResponse<Empleado>>(`${this.baseUrl}/paginar`, { params });
}


  crear(empleado: Empleado): Observable<Empleado> {
    return this.http.post<Empleado>(this.baseUrl, empleado);
  }

  actualizar(empleado: Empleado): Observable<Empleado> {
    return this.http.put<Empleado>(`${this.baseUrl}/${empleado.id}`, empleado);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  generarCertificado(id: number, tipo: string): Observable<Blob> {
  const url = `${this.baseUrl}/certificado/${id}?tipoCertificado=${tipo}`;
  return this.http.get(url, { responseType: 'blob' });
}

  enviarCertificadoPorCorreo(id: number, tipo: string): Observable<string> {
  const url = `${this.baseUrl}/certificado/enviar/${id}?tipoCertificado=${tipo}`;
  return this.http.post(url, {}, { responseType: 'text' });
}

obtenerTiposCertificado(id: number): Observable<TipoCertificado[]> {
  return this.http.get<TipoCertificado[]>(`${this.baseUrl}/${id}/tipos-certificado`);
}

descargarExcel(): Observable<Blob> {
  const url = `${this.baseUrl}/excel`;
  return this.http.get(url, { responseType: 'blob' });
}

subirExcel(archivo: File): Observable<string> {
  const formData = new FormData();
  formData.append('archivo', archivo);
  return this.http.post(`${this.baseUrl}/cargar-excel`, formData, {
    responseType: 'text',
  });
}

}
