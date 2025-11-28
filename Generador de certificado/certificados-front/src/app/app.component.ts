import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule, formatDate } from '@angular/common';
import { EmpleadoService, Empleado, TipoCertificado } from './services/empleado.service';
import { Arl, CajaCompensacion, Cargo, Eps, FondoPensiones, TipoContrato, TipoRetiro } from './services/empleado.enums';
import Swal from 'sweetalert2';
import { fail } from 'assert';

enum Section {
  EMPLEADOS,
  CERTIFICADOS,
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  readonly SECTIONS = Section;

  vm = {
    selectedSection: Section.EMPLEADOS,
    camposFormulario: [
      { id: 'nombre', label: 'Nombre' },
      { id: 'apellido', label: 'Apellido' },
      { id: 'cedula', label: 'Cédula' },
      { id: 'fechaInicio', label: 'Fecha de Inicio' },
      { id: 'correo', label: 'Correo Electrónico' },
    ],
    cargando: false,
    file: null as File | null,
    empleadoOriginal: null as Empleado | null,
    mostrarTipoRetiro: false,
    estadoActivo: null as boolean | null,
    cargosDisponibles: [] as Cargo[],
    fondosPensionesDisponibles: [] as FondoPensiones[],
    epssDisponibles: [] as Eps[],
    arlsDisponibles: [] as Arl[],
    cajasCompensacionDisponibles: [] as CajaCompensacion[],
    tiposRetiroDisponibles: [] as TipoRetiro[],
    tiposContratoDisponibles: [] as TipoContrato[],
    empleados: [] as Empleado[],
    empleadosFiltrados: [] as Empleado[],
    empleado: this.getEmptyEmpleado(),
    empleadoSeleccionado: null as Empleado | null,
    tiposCertificado: [] as TipoCertificado[],
    isEditMode: false,
    estadoFiltro: '' as '' | 'activo' | 'inactivo',
    tipoCertificado: '',
    filtroCampo: 'nombre',
    filtroValor: '',
    filtroCamposDisponibles: ['nombre', 'apellido', 'cedula', 'cargo', 'tipoContrato', 'fondoPensiones', 'eps', 'arl', 'cajaCompensacion'],
    paginaActual: 0,
    tamanioPagina: 4,
    totalPaginas: 0,
    totalEmpleadosFiltrados: 0,
  };

  constructor(private empleadoService: EmpleadoService) {}

  ngOnInit(): void {
    this.initOpcionesEnums();
    this.cargarEmpleados();
  }

  // ─── Inicialización ─────────────────────────────────────────
  private initOpcionesEnums(): void {
    this.vm.cargosDisponibles = Object.values(Cargo);
    this.vm.tiposContratoDisponibles = Object.values(TipoContrato);
    this.vm.fondosPensionesDisponibles = Object.values(FondoPensiones);
    this.vm.epssDisponibles = Object.values(Eps);
    this.vm.arlsDisponibles = Object.values(Arl);
    this.vm.cajasCompensacionDisponibles = Object.values(CajaCompensacion);
    this.vm.tiposRetiroDisponibles = Object.values(TipoRetiro);
  }

  private getEmptyEmpleado(): Empleado {
    return {
      nombre: '',
      apellido: '',
      cedula: '',
      cargo: null,
      salario: null,
      fechaInicio: '',
      tipoContrato: null,
      correo: '',
      fondoPensiones: null,
      eps: null,
      arl: null,
      cajaCompensacion: null,
      tipoRetiro: null,
      fechaRetiro: '',
      activo: true,
    };
  }

 toggleEstadoFiltro(estado: 'activo' | 'inactivo') {
  const mismoEstadoSeleccionado = this.vm.estadoFiltro === estado;

  this.vm.estadoFiltro = mismoEstadoSeleccionado ? '' : estado;

  // Estado activo se ajusta según el botón
  this.vm.estadoActivo = this.vm.estadoFiltro === ''
    ? null
    : this.vm.estadoFiltro === 'activo';

  this.onFiltroCambio();
}

cargarTiposCertificado(idEmpleado: number): void {
  this.empleadoService.obtenerTiposCertificado(idEmpleado).subscribe({
    next: (tipos) => (this.vm.tiposCertificado = tipos),
    error: (err) => console.error('Error cargando tipos de certificado:', err)
  });
}


  // ─── Formatear salario ─────────────────────────────────────
  formatearVistaSalario(valor: number | null): string {
    if (valor === null || valor === 0) return '';
    return valor.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  alCambiarSalario(event: Event): void {
    const input = event.target as HTMLInputElement;
    // Eliminar todo lo que no sea dígito
    const valorLimpio = input.value.replace(/[^\d]/g, '');
     // Convertir a número
    const numero = Number(valorLimpio);

    // Actualizar el modelo con número o null si no hay valor
    this.vm.empleado.salario = isNaN(numero) ? null : numero;
     // Formatear número con puntos y agregar $ fijo a la izquierda
    input.value = this.vm.empleado.salario !== null ? `$ ${this.formatearVistaSalario(this.vm.empleado.salario)}` : '';
    
  }

  tocoCampoSalario: boolean = false;

  alTocarCampoSalario(): void {
  this.tocoCampoSalario = true;
  }

  // ─── Navegación ──────────────────────────────────────────────
  changeSection(section: Section): void {
      // Guarda la sección seleccionada
  this.vm.selectedSection = section;

  // Solo resetea si NO estás editando ni creando algo nuevo
  const estaCreandoNuevo = this.vm.empleado?.id == null;
  if (!this.vm.isEditMode && !estaCreandoNuevo) {
    this.resetFormulario();
  }

  this.vm.empleadoSeleccionado = null;
}

  seleccionarEmpleado(emp: Empleado): void {
  this.vm.empleadoSeleccionado = emp;
  this.vm.tipoCertificado = ''; // Limpiar selección previa
  this.vm.tiposCertificado = []; // Limpiar la lista anterior

  this.empleadoService.obtenerTiposCertificado(emp.id!)
    .subscribe(tipos => {
      this.vm.tiposCertificado = tipos;
    });
}

  cancelarEdicion(): void {
    this.resetFormulario();
  }

iniciarEdicion(emp: Empleado): void {
  const copia = { ...emp };

  copia.fechaInicio = this.convertirFechaAInput(emp.fechaInicio);
  copia.fechaRetiro = this.convertirFechaAInput(emp.fechaRetiro);

  this.vm.empleado = copia;
  this.vm.empleadoOriginal = { ...emp };
  this.vm.isEditMode = true;
  this.vm.selectedSection = Section.EMPLEADOS;
}

private convertirFechaAInput(fecha: string | null | undefined): string {
  if (!fecha) return '';
  const partes = fecha.split('/');
  if (partes.length === 3) {
    const [dia, mes, anio] = partes;
    return `${anio}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
  }
  return '';
}

get salarioInvalido(): boolean {
  const salario = this.vm.empleado.salario;
  return salario == null || salario <= 0;
}

  // ─── CRUD Empleados ──────────────────────────────────────────
  onSubmit(): void {
    this.vm.isEditMode ? this.actualizarEmpleado() : this.crearEmpleado();
  }

  private crearEmpleado(): void {

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  if (!this.vm.empleado.correo || !emailRegex.test(this.vm.empleado.correo)) {
    this.mostrarMensaje('warning', 'Correo inválido', 'Debes ingresar un correo electrónico válido.');
    return;
  }

    if (this.vm.empleado.salario == null) {
    this.tocoCampoSalario = true;
    this.mostrarMensaje('warning', 'Campo requerido', 'El salario es obligatorio.');
    return;
  }

    const emp = this.formatearEmpleado(this.vm.empleado);
    emp.fechaInicio = formatDate(emp.fechaInicio, 'dd/MM/yyyy', 'en-US');

    this.empleadoService.crear(emp).subscribe({
      next: () =>
        this.mostrarMensaje('success', 'Empleado creado', `${emp.nombre} ${emp.apellido} fue creado.`),
      error: (err) => this.manejarErrorCreacion(err),
      complete: () => this.finalizarOperacion(),
    });
  }

  get mostrarTipoRetiro(): boolean {
  return !this.vm.empleado.activo && !!this.vm.empleado.id; // Solo si está inactivo Y no es nuevo
  }

private actualizarEmpleado(): void {
  if (!this.vm.empleado.id) return;

  const emp = { ...this.vm.empleado };

  if (emp.activo) {
    // Al activar: limpiar datos de retiro
    emp.tipoRetiro = null;
    emp.fechaRetiro = '';
  } else {
    // Al inactivar: validar que ambos campos estén presentes
    if (!emp.tipoRetiro || !emp.fechaRetiro) {
      return this.mostrarMensaje(
        'warning',
        'Campos requeridos',
        'Debes seleccionar un tipo de retiro y una fecha de retiro.'
      );
    }
  }

  const empleadoFormateado = this.formatearEmpleado(emp);

  const cambioEstado = this.vm.empleadoOriginal?.activo !== emp.activo;

  this.empleadoService.actualizar(empleadoFormateado).subscribe({
    next: () => {
      const mensaje = cambioEstado
        ? `Empleado ${emp.activo ? 'activado' : 'inactivado'}`
        : 'Empleado actualizado';
      const texto = cambioEstado
        ? `${emp.nombre} ${emp.apellido} ha sido ${emp.activo ? 'activado' : 'inactivado'}.`
        : `${emp.nombre} ${emp.apellido} ha sido actualizado.`;

      this.mostrarMensaje('success', mensaje, texto);

       // 🔄 Actualizar en la lista local
  const idx = this.vm.empleados.findIndex(e => e.id === emp.id);
  if (idx !== -1) {
    this.vm.empleados[idx] = { ...emp };
  }
    },
    error: () =>
      this.mostrarMensaje('error', 'Error', '❌ Error al actualizar el empleado'),
    complete: () => this.finalizarOperacion(),
  });
}


activarEmpleado(empleado: Empleado): void {
  this.cambiarEstadoEmpleado(empleado, true);
}

inactivarEmpleado(empleado: Empleado): void {
  this.cambiarEstadoEmpleado(empleado, false);
}

private cambiarEstadoEmpleado(empleado: Empleado, activo: boolean): void {
  if (!empleado.id) return;

  const emp = { ...empleado };
  emp.activo = activo;

  if (activo) {
    emp.tipoRetiro = null;
    emp.fechaRetiro = '';
  } else if (!emp.tipoRetiro || !emp.fechaRetiro) {
    // Redirige al formulario para completar tipo y fecha de retiro
    this.mostrarMensaje(
      'warning',
      'Completa los datos de retiro',
      'Debes ingresar el tipo y la fecha de retiro para inactivar al empleado.'
    );
    this.iniciarEdicion({ ...empleado, activo: false }); // fuerza estado inactivo
    return;
  }

  const empleadoFormateado = this.formatearEmpleado(emp);

  this.empleadoService.actualizar(empleadoFormateado).subscribe({
    next: () => {
      const estado = activo ? 'activado' : 'inactivado';
      this.mostrarMensaje(
        'success',
        `Empleado ${estado}`,
        `${emp.nombre} ${emp.apellido} ha sido ${estado}.`
      );
    },
    error: () =>
      this.mostrarMensaje('error', 'Error', '❌ Error al actualizar el estado del empleado'),
    complete: () => this.finalizarOperacion(),
  });
}



  eliminarDesdeCertificados(): void {
    const id = this.vm.empleadoSeleccionado?.id;
    if (!id) return;

    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.empleadoService.eliminar(id).subscribe({
          next: () => {
            this.mostrarMensaje('success', 'Empleado eliminado', 'Empleado eliminado exitosamente.');
            this.vm.empleadoSeleccionado = null;
            this.finalizarOperacion();
          },
          error: () => this.mostrarMensaje('error', 'Error', '❌ Error al eliminar el empleado'),
        });
      }
    });
  }

  editarDesdeCertificados(): void {
    if (this.vm.empleadoSeleccionado) {
      this.iniciarEdicion(this.vm.empleadoSeleccionado);
    }
  }

  // ─── Certificados ────────────────────────────────────────────
  generarCertificado(): void {
  const id = this.vm.empleadoSeleccionado?.id;
  const tipo = this.vm.tipoCertificado;
  if (!id || !tipo) return;

  this.vm.cargando = true; // Mostrar modal de carga

  this.empleadoService.generarCertificado(id, tipo).subscribe({
    next: (blob: Blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificado_${this.vm.empleadoSeleccionado!.cedula}.pdf`;
      a.click();
      URL.revokeObjectURL(url);

      this.mostrarMensaje(
        'success',
        'Certificado generado',
        `📄 Certificado generado para ${this.vm.empleadoSeleccionado!.nombre}`
      );
    },
    error: () =>
      this.mostrarMensaje('error', 'Error', '❌ Error al generar el certificado'),
    complete: () => {
      this.vm.cargando = false; // Ocultar modal de carga
    }
  });

}


  enviarCertificadoPorCorreo(): void {
  const id = this.vm.empleadoSeleccionado?.id;
  const tipo = this.vm.tipoCertificado;
  if (!id || !tipo) {
    return this.mostrarMensaje('warning', 'Faltan datos', 'Selecciona un empleado y tipo de certificado.');
  }

  this.vm.cargando = true; // Mostrar modal de carga

  this.empleadoService.enviarCertificadoPorCorreo(id, tipo).subscribe({
    next: () =>
      this.mostrarMensaje(
        'success',
        'Correo enviado',
        `📧 Certificado enviado a ${this.vm.empleadoSeleccionado!.correo}`
      ),
    error: () => this.mostrarMensaje('error', 'Error', '❌ Error al enviar el certificado'),
    complete: () => {
      this.vm.cargando = false; // Ocultar modal de carga
    }
  });
}


  // ─── Filtros y Paginación ────────────────────────────────────
  onFiltroCambio(): void {
    this.vm.paginaActual = 0;
    this.cargarEmpleados();
  }

  cambiarPagina(direccion: 'anterior' | 'siguiente' | number): void {
    if (typeof direccion === 'number' && direccion >= 0 && direccion < this.vm.totalPaginas) {
      this.vm.paginaActual = direccion;
    } else if (direccion === 'anterior' && this.vm.paginaActual > 0) {
      this.vm.paginaActual--;
    } else if (direccion === 'siguiente' && this.vm.paginaActual + 1 < this.vm.totalPaginas) {
      this.vm.paginaActual++;
    }
    this.cargarEmpleados();
  }

  getPaginas(): number[] {
    return Array.from({ length: this.vm.totalPaginas }, (_, i) => i);
  }

 private cargarEmpleados(resetFiltros = false): void {

    // Reiniciar filtros antes de cargar (solo si vienes de una acción como subir archivo)
   if (resetFiltros) {
    this.vm.filtroCampo = 'nombre';
    this.vm.filtroValor = '';
    this.vm.estadoActivo = null;
    this.vm.paginaActual = 0;
  }

    this.empleadoService
    .obtenerPaginado(
      this.vm.paginaActual,
      this.vm.tamanioPagina,
      this.vm.filtroCampo,
      this.vm.filtroValor,
      this.vm.estadoActivo
    )
    .subscribe({
      next: ({ content, totalPages, totalElements }) => {
        this.vm.empleados = content;
        this.vm.empleadosFiltrados = [...content];
        this.vm.totalPaginas = totalPages;
        this.vm.totalEmpleadosFiltrados = totalElements;
      },
      error: () => this.mostrarMensaje('error', 'Error', '❌ Error cargando empleados'),
    });
}

onEstadoActivoCambio(valor: string): void {
  if (valor === 'todos') {
    this.vm.estadoActivo = null;
  } else if (valor === 'activos') {
    this.vm.estadoActivo = true;
  } else if (valor === 'inactivos') {
    this.vm.estadoActivo = false;
  }
  this.vm.paginaActual = 0; // reset página cuando cambia filtro
  this.cargarEmpleados();
}



  // ─── Helpers ────────────────────────────────────────────────
  private resetFormulario(): void {
    this.vm.empleado = this.getEmptyEmpleado();
    this.vm.empleadoOriginal = null;
    this.vm.isEditMode = false;
  }

  private finalizarOperacion(): void {
    this.resetFormulario();
    this.vm.estadoActivo = null;
    this.cargarEmpleados();
    this.vm.mostrarTipoRetiro = false;
  }

  private formatearEmpleado(emp: Empleado): Empleado {
    return {
      ...emp,
      nombre: emp.nombre ? emp.nombre.trim().toUpperCase() : '',
      apellido: emp.apellido ? emp.apellido.trim().toUpperCase() : '',
      cedula: emp.cedula.trim(),
      correo: emp.correo.trim().toLowerCase(),
      fechaRetiro: emp.fechaRetiro ? formatDate(emp.fechaRetiro, 'dd/MM/yyyy', 'en-US') : '',
      fechaInicio: emp.fechaInicio ? formatDate(emp.fechaInicio, 'dd/MM/yyyy', 'en-US') : '',
    };
  }

  private manejarErrorCreacion(err: any): void {
    let mensaje = '❌ Error al guardar el empleado';
    if (err.status === 400) {
      const backendMessage =
        typeof err.error === 'string' ? err.error : err.error?.message || JSON.stringify(err.error);
      mensaje = backendMessage.toLowerCase().includes('cédula')
        ? '⚠️ Ya existe un empleado con esa cédula'
        : backendMessage;
    }
    this.mostrarMensaje('error', 'Error', mensaje);
  }

  private mostrarMensaje(icon: any, title: string, text: string): void {
    Swal.fire({ icon, title, text, timer: 2500, showConfirmButton: false });
  }

 descargarExcel(): void {
  this.vm.cargando = true; // Mostrar modal de carga

  this.empleadoService.descargarExcel().subscribe({
    next: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'empleados.xlsx';
      a.click();
      window.URL.revokeObjectURL(url);
    },
    error: () => {
      this.mostrarMensaje('error', 'Error', '❌ No se pudo descargar el archivo');
    },
    complete: () => {
      this.vm.cargando = false; // Ocultar modal
    }
  });
}


 onArchivoSeleccionado(event: Event): void {
  const input = event.target as HTMLInputElement;
  this.vm.file = input.files?.[0] || null; // ✅ Corregido
}

subirArchivo(): void {
  if (!this.vm.file) return;

  this.vm.cargando = true;

  this.empleadoService.subirExcel(this.vm.file).subscribe({
    next: (mensaje: string) => {
      Swal.fire({
        icon: 'success',
        title: 'Carga exitosa',
        text: mensaje,
        confirmButtonText: 'Aceptar'
      });

      this.cargarEmpleados(); // ✅ Recargar empleados después de subir
    },
    error: () => {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo cargar el archivo',
        confirmButtonText: 'Aceptar'
      });
    },
    complete: () => {
      this.vm.cargando = false; // Ocultar modal de carga
    }
  });
}


}
