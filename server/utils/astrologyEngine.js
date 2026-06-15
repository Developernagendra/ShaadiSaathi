/**
 * Astrology Engine
 * Deterministic generation of Kundli Gun Milan and Shubh Muhurat data.
 * Returns translation keys compatible with i18next to support en, hi, bho, mai.
 */

const crypto = require('crypto');

// Generate a consistent numeric seed from input strings
function generateSeed(...inputs) {
  const str = inputs.join('|').toLowerCase().replace(/\s+/g, '');
  const hash = crypto.createHash('sha256').update(str).digest('hex');
  return parseInt(hash.substring(0, 8), 16);
}

function seededRandom(seed) {
  let s = seed;
  return function() {
    s = Math.sin(s) * 10000;
    return s - Math.floor(s);
  };
}

exports.calculateGunMilan = (bride, groom) => {
  const seed = generateSeed(
    bride.name, bride.dob, bride.time, bride.place,
    groom.name, groom.dob, groom.time, groom.place
  );
  const rand = seededRandom(seed);
  
  const getScore = (max) => {
    const fraction = 0.3 + (rand() * 0.7); 
    return Number((fraction * max).toFixed(1));
  };

  const varna = getScore(1);
  const vashya = getScore(2);
  const tara = getScore(3);
  const yoni = getScore(4);
  const grahaMaitri = getScore(5);
  const gana = getScore(6);
  const bhakoot = getScore(7);
  const nadi = getScore(8);

  const total = Number((varna + vashya + tara + yoni + grahaMaitri + gana + bhakoot + nadi).toFixed(1));
  const percentage = Math.round((total / 36) * 100);

  const brideManglikSeed = generateSeed(bride.name, bride.dob, bride.time);
  const groomManglikSeed = generateSeed(groom.name, groom.dob, groom.time);
  
  const brideIsManglik = (brideManglikSeed % 10) > 7;
  const groomIsManglik = (groomManglikSeed % 10) > 7;
  
  let manglikStatusKey = 'astrology.manglikNone';
  let manglikMatch = true;
  
  if (brideIsManglik && groomIsManglik) {
    manglikStatusKey = 'astrology.manglikBothCancelled';
  } else if (brideIsManglik && !groomIsManglik) {
    manglikStatusKey = 'astrology.manglikBrideOnly';
    manglikMatch = false;
  } else if (!brideIsManglik && groomIsManglik) {
    manglikStatusKey = 'astrology.manglikGroomOnly';
    manglikMatch = false;
  }

  const getRashiKey = (dob) => {
    const rashis = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'];
    const m = new Date(dob).getMonth() || 0;
    return `astrology.rashi.${rashis[m]}`;
  };

  return {
    brideDetails: {
      name: bride.name,
      rashiKey: getRashiKey(bride.dob),
      isManglik: brideIsManglik
    },
    groomDetails: {
      name: groom.name,
      rashiKey: getRashiKey(groom.dob),
      isManglik: groomIsManglik
    },
    score: {
      varna: { obtained: varna, max: 1, key: 'astrology.koota.varna' },
      vashya: { obtained: vashya, max: 2, key: 'astrology.koota.vashya' },
      tara: { obtained: tara, max: 3, key: 'astrology.koota.tara' },
      yoni: { obtained: yoni, max: 4, key: 'astrology.koota.yoni' },
      grahaMaitri: { obtained: grahaMaitri, max: 5, key: 'astrology.koota.grahaMaitri' },
      gana: { obtained: gana, max: 6, key: 'astrology.koota.gana' },
      bhakoot: { obtained: bhakoot, max: 7, key: 'astrology.koota.bhakoot' },
      nadi: { obtained: nadi, max: 8, key: 'astrology.koota.nadi' }
    },
    totalScore: total,
    outOf: 36,
    percentage,
    manglikAnalysis: {
      statusKey: manglikStatusKey,
      isMatch: manglikMatch
    },
    conclusionKey: total >= 18 ? 'astrology.conclusionExcellent' : 'astrology.conclusionBelowAverage'
  };
};

exports.calculateMuhurat = (city, state, year, month, brideName, groomName) => {
  const seedStr = city + state + year.toString() + month.toString() + brideName + groomName;
  const seed = generateSeed(seedStr);
  const rand = seededRandom(seed);
  
  const daysInMonth = new Date(year, month, 0).getDate();
  const numDates = 2 + Math.floor(rand() * 3);
  
  const nakshatras = ['rohini', 'mrigashira', 'magha', 'uttara_phalguni', 'hasta', 'swati', 'anuradha', 'moola', 'uttara_ashadha', 'uttara_bhadrapada', 'revati'];
  const lagnas = ['taurus', 'gemini', 'virgo', 'libra', 'sagittarius'];
  const tithis = ['shukla_panchami', 'shukla_ekadashi', 'krishna_ekadashi', 'shukla_purnima', 'shukla_navami'];
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  
  const muhurats = [];
  
  for (let i = 0; i < numDates; i++) {
    const dayDate = Math.floor(rand() * daysInMonth) + 1;
    const dateObj = new Date(year, month - 1, dayDate);
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(dayDate).padStart(2, '0')}`;
    
    const startHour = 8 + Math.floor(rand() * 10);
    const endHour = startHour + 2 + Math.floor(rand() * 4);
    
    const startTime = `${String(startHour).padStart(2, '0')}:${Math.floor(rand() * 60).toString().padStart(2, '0')}`;
    const endTime = `${String(endHour).padStart(2, '0')}:${Math.floor(rand() * 60).toString().padStart(2, '0')}`;
    
    const nIdx = Math.floor(rand() * nakshatras.length);
    const lIdx = Math.floor(rand() * lagnas.length);
    const tIdx = Math.floor(rand() * tithis.length);

    const rahuStart = `${String(10 + Math.floor(rand()*4)).padStart(2, '0')}:00`;
    const rahuEnd = `${String(parseInt(rahuStart) + 1).padStart(2, '0')}:30`;

    const abhijitStart = `11:${45 + Math.floor(rand()*10)}`;
    const abhijitEnd = `12:${30 + Math.floor(rand()*10)}`;

    const auspiciousRating = (7.5 + (rand() * 2.5)).toFixed(1);

    muhurats.push({
      date: dateStr,
      dayKey: `astrology.days.${days[dateObj.getDay()]}`,
      nakshatraKey: `astrology.nakshatra.${nakshatras[nIdx]}`,
      lagnaKey: `astrology.lagna.${lagnas[lIdx]}`,
      tithiKey: `astrology.tithi.${tithis[tIdx]}`,
      shubhTiming: `${startTime} – ${endTime}`,
      rahuKaal: `${rahuStart} – ${rahuEnd}`,
      abhijitMuhurat: `${abhijitStart} – ${abhijitEnd}`,
      auspiciousRating: parseFloat(auspiciousRating),
      significanceKey: 'astrology.significanceExcellent'
    });
  }
  
  return muhurats.sort((a, b) => new Date(a.date) - new Date(b.date));
};
