

const LabelSource: any = {
  'male': {
    active: 'Activo',
    inactive: 'Inactivo',
    deleted: 'Eliminado',
    coming: 'Próximo',
    natural: 'Persona Física',
    legal: 'Persona Jurídica',
    internal: 'Interno',
    private: 'Privado',
  },
  'female': {
    active: 'Activa',
    inactiva: 'Inactiva',
    deleted: 'Eliminada',
    coming: 'Próxima',
    natural: 'Persona Física',
    legal: 'Persona Jurídica',
    internal: 'Interna',
    private: 'Privada',
  },
  'error.login': 'Usuario o Contraseña inválida',
  'error.fatal': 'No se pudo completar la solicitud, por favor intenta más tarde.',
  'error.signup': 'No se pudo crear completar la creación del usuario.',
};


export class LABEL {

  static exists(value: string): boolean {
    return !!(LabelSource[value]);
  }

  static parse(value: string, type: 'male' | 'female' | 'default' = 'male'): string {
    if (type === 'male') {
      return LabelSource.male[value];
    }

    if (type === 'default') {
      return LabelSource[value];
    }

    return LabelSource.female[value];
  }

  static errorFatal(): string {
    return LabelSource['error.fatal'];
  }

}

