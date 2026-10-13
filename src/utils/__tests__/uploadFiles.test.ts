import { mimeFromName, uploadSourceFromAsset } from '@/utils/uploadFiles';

describe('mimeFromName', () => {
  it('deduce el tipo de los formatos que acepta el backend', () => {
    expect(mimeFromName('hemograma.PDF')).toBe('application/pdf');
    expect(mimeFromName('foto.jpg')).toBe('image/jpeg');
    expect(mimeFromName('foto.jpeg')).toBe('image/jpeg');
    expect(mimeFromName('foto.png')).toBe('image/png');
    expect(mimeFromName('foto.webp')).toBe('image/webp');
    expect(mimeFromName('foto.heic')).toBe('image/heic');
    expect(mimeFromName('sin-extension')).toBe('application/octet-stream');
  });
});

describe('uploadSourceFromAsset', () => {
  it('un archivo local (Android/iOS) se sube por su uri con nombre y tipo', () => {
    expect(
      uploadSourceFromAsset(
        {
          uri: 'file:///cache/DocumentPicker/abc.pdf',
          name: 'hemograma.pdf',
          mimeType: 'application/pdf',
        },
        'archivo.pdf',
      ),
    ).toEqual({
      uri: 'file:///cache/DocumentPicker/abc.pdf',
      name: 'hemograma.pdf',
      type: 'application/pdf',
    });
  });

  it('sin nombre ni tipo los deduce de la uri o usa el respaldo', () => {
    expect(
      uploadSourceFromAsset(
        { uri: 'file:///cache/ImagePicker/42.png', fileName: null },
        'foto.jpg',
      ),
    ).toEqual({
      uri: 'file:///cache/ImagePicker/42.png',
      name: '42.png',
      type: 'image/png',
    });
    expect(
      uploadSourceFromAsset({ uri: 'content://media/external/9' }, 'foto.jpg'),
    ).toEqual({
      uri: 'content://media/external/9',
      name: 'foto.jpg',
      type: 'image/jpeg',
    });
  });

  it('en web el selector entrega el File en memoria y se sube tal cual', () => {
    const file = new Blob(['%PDF-'], { type: 'application/pdf' });
    expect(
      uploadSourceFromAsset({ uri: 'blob:x', name: 'r.pdf', file }, 'archivo.pdf'),
    ).toEqual({ blob: file, name: 'r.pdf' });
  });
});
