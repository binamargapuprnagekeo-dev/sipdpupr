/**
 * Helper utilities for Indonesian formatting (Rupiah, Terbilang, Dates)
 */

export function formatRupiah(amount: number, includeDecimal = false): string {
  if (isNaN(amount)) return 'Rp 0';
  const formatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: includeDecimal ? 2 : 0,
    maximumFractionDigits: includeDecimal ? 2 : 0,
  });
  return formatter.format(amount).replace(/\s+/g, ' ');
}

export function terbilang(nominal: number): string {
  const bilangan = [
    '',
    'Satu',
    'Dua',
    'Tiga',
    'Empat',
    'Lima',
    'Enam',
    'Tujuh',
    'Delapan',
    'Sembilan',
    'Sepuluh',
    'Sebelas',
  ];

  let temp = '';
  const nominalInt = Math.floor(nominal);

  if (nominalInt < 12) {
    temp = ' ' + bilangan[nominalInt];
  } else if (nominalInt < 20) {
    temp = terbilang(nominalInt - 10) + ' Belas';
  } else if (nominalInt < 100) {
    temp = terbilang(Math.floor(nominalInt / 10)) + ' Puluh' + terbilang(nominalInt % 10);
  } else if (nominalInt < 200) {
    temp = ' Seratus' + terbilang(nominalInt - 100);
  } else if (nominalInt < 1000) {
    temp = terbilang(Math.floor(nominalInt / 100)) + ' Ratus' + terbilang(nominalInt % 100);
  } else if (nominalInt < 2000) {
    temp = ' Seribu' + terbilang(nominalInt - 1000);
  } else if (nominalInt < 1000000) {
    temp = terbilang(Math.floor(nominalInt / 1000)) + ' Ribu' + terbilang(nominalInt % 1000);
  } else if (nominalInt < 1000000000) {
    temp = terbilang(Math.floor(nominalInt / 1000000)) + ' Juta' + terbilang(nominalInt % 1000000);
  } else if (nominalInt < 1000000000000) {
    temp = terbilang(Math.floor(nominalInt / 1000000000)) + ' Milyar' + terbilang(nominalInt % 1000000000);
  } else if (nominalInt < 1000000000000000) {
    temp = terbilang(Math.floor(nominalInt / 1000000000000)) + ' Triliun' + terbilang(nominalInt % 1000000000000);
  }

  // Clean trailing and double spaces
  const result = temp.replace(/\s+/g, ' ').trim();
  return result ? `${result} Rupiah` : 'Nol Rupiah';
}

export function formatTanggalIndo(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const months = [
      'Januari',
      'Februari',
      'Maret',
      'April',
      'Mei',
      'Juni',
      'Juli',
      'Agustus',
      'September',
      'Oktober',
      'November',
      'Desember',
    ];
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const year = parts[0];
    const monthIndex = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    
    if (monthIndex >= 0 && monthIndex < 12) {
      return `${day} ${months[monthIndex]} ${year}`;
    }
    return dateStr;
  } catch (e) {
    return dateStr;
  }
}
