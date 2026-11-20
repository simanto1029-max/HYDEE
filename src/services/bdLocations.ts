// Bangladesh locations: Division -> District -> Thana / Upazila
// 8 divisions, 64 districts. Used by the checkout (customer picks them) and the admin order details.
//
// IMPORTANT: nothing here needs a database change. The chosen location is saved inside the
// existing order "district" text as:  "Thana, District, Division"   (example: "Dhanmondi, Dhaka, Dhaka Division")

const list = (s: string): string[] =>
  s
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);

// Official Dhaka Metropolitan (city) police stations. Customers here get the "Inside Dhaka" delivery charge.
const DHAKA_METRO_THANAS = list(
  'Adabor, Badda, Banani, Bangshal, Bhashantek, Bimanbandar, Cantonment, Chawkbazar, Dakshinkhan, Darus Salam, Demra, Dhanmondi, ' +
    'Gendaria, Gulshan, Hatirjheel, Hazaribagh, Jatrabari, Kadamtali, Kafrul, Kalabagan, Kamrangirchar, Khilgaon, Khilkhet, Kotwali, ' +
    'Lalbagh, Mirpur, Mohammadpur, Motijheel, Mugda, New Market, Pallabi, Paltan, Ramna, Rampura, Sabujbagh, Shah Ali, Shahbagh, ' +
    'Shahjahanpur, Sher-e-Bangla Nagar, Shyampur, Sutrapur, Tejgaon, Tejgaon Industrial Area, Turag, Uttar Khan, Uttara East, ' +
    'Uttara West, Vatara, Wari'
);

const RAW: Record<string, Record<string, string[]>> = {
  Barishal: {
    Barguna: list('Amtali, Bamna, Barguna Sadar, Betagi, Patharghata, Taltali'),
    Barishal: list(
      'Agailjhara, Babuganj, Bakerganj, Banaripara, Barishal Sadar, Gournadi, Hizla, Mehendiganj, Muladi, Wazirpur'
    ),
    Bhola: list('Bhola Sadar, Burhanuddin, Char Fasson, Daulatkhan, Lalmohan, Manpura, Tazumuddin'),
    Jhalokati: list('Jhalokati Sadar, Kathalia, Nalchity, Rajapur'),
    Patuakhali: list('Bauphal, Dashmina, Dumki, Galachipa, Kalapara, Mirzaganj, Patuakhali Sadar, Rangabali'),
    Pirojpur: list('Bhandaria, Kawkhali, Mathbaria, Nazirpur, Nesarabad, Pirojpur Sadar, Zianagar'),
  },
  Chattogram: {
    Bandarban: list('Ali Kadam, Bandarban Sadar, Lama, Naikhongchhari, Rowangchhari, Ruma, Thanchi'),
    Brahmanbaria: list(
      'Akhaura, Ashuganj, Bancharampur, Bijoynagar, Brahmanbaria Sadar, Kasba, Nabinagar, Nasirnagar, Sarail'
    ),
    Chandpur: list(
      'Chandpur Sadar, Faridganj, Haimchar, Haziganj, Kachua, Matlab Dakshin, Matlab Uttar, Shahrasti'
    ),
    Chattogram: list(
      'Akbar Shah, Anwara, Bakalia, Banshkhali, Bayazid Bostami, Boalkhali, Chandanaish, Chandgaon, Chawkbazar, Double Mooring, ' +
        'EPZ, Fatikchhari, Halishahar, Hathazari, Karnaphuli, Khulshi, Kotwali, Lohagara, Mirsharai, Pahartali, Panchlaish, Patenga, ' +
        'Patiya, Rangunia, Raozan, Sadarghat, Sandwip, Satkania, Sitakunda'
    ),
    "Cox's Bazar": list(
      "Chakaria, Cox's Bazar Sadar, Kutubdia, Maheshkhali, Pekua, Ramu, Teknaf, Ukhia"
    ),
    Cumilla: list(
      'Barura, Brahmanpara, Burichang, Chandina, Chauddagram, Cumilla Adarsha Sadar, Cumilla Sadar Dakshin, Daudkandi, Debidwar, ' +
        'Homna, Laksam, Lalmai, Meghna, Monohargonj, Muradnagar, Nangalkot, Titas'
    ),
    Feni: list('Chhagalnaiya, Daganbhuiyan, Feni Sadar, Fulgazi, Parshuram, Sonagazi'),
    Khagrachhari: list(
      'Dighinala, Guimara, Khagrachhari Sadar, Lakshmichhari, Mahalchhari, Manikchhari, Matiranga, Panchhari, Ramgarh'
    ),
    Lakshmipur: list('Kamalnagar, Lakshmipur Sadar, Raipur, Ramganj, Ramgati'),
    Noakhali: list(
      'Begumganj, Chatkhil, Companiganj, Hatiya, Kabirhat, Noakhali Sadar, Senbagh, Sonaimuri, Subarnachar'
    ),
    Rangamati: list(
      'Baghaichhari, Barkal, Belaichhari, Juraichhari, Kaptai, Kawkhali, Langadu, Naniarchar, Rajasthali, Rangamati Sadar'
    ),
  },
  Dhaka: {
    Dhaka: [...DHAKA_METRO_THANAS, ...list('Dhamrai, Dohar, Keraniganj, Nawabganj, Savar')],
    Faridpur: list(
      'Alfadanga, Bhanga, Boalmari, Charbhadrasan, Faridpur Sadar, Madhukhali, Nagarkanda, Sadarpur, Saltha'
    ),
    Gazipur: list(
      'Gazipur Sadar, Kaliakair, Kaliganj, Kapasia, Sreepur, Tongi East, Tongi West, Konabari, Gachha, Basan'
    ),
    Gopalganj: list('Gopalganj Sadar, Kashiani, Kotalipara, Muksudpur, Tungipara'),
    Kishoreganj: list(
      'Austagram, Bajitpur, Bhairab, Hossainpur, Itna, Karimganj, Katiadi, Kishoreganj Sadar, Kuliarchar, Mithamain, Nikli, Pakundia, Tarail'
    ),
    Madaripur: list('Dasar, Kalkini, Madaripur Sadar, Rajoir, Shibchar'),
    Manikganj: list('Daulatpur, Ghior, Harirampur, Manikganj Sadar, Saturia, Shivalaya, Singair'),
    Munshiganj: list('Gazaria, Lohajang, Munshiganj Sadar, Sirajdikhan, Sreenagar, Tongibari'),
    Narayanganj: list(
      'Araihazar, Bandar, Fatullah, Narayanganj Sadar, Rupganj, Siddhirganj, Sonargaon'
    ),
    Narsingdi: list('Belabo, Monohardi, Narsingdi Sadar, Palash, Raipura, Shibpur'),
    Rajbari: list('Baliakandi, Goalanda, Kalukhali, Pangsha, Rajbari Sadar'),
    Shariatpur: list('Bhedarganj, Damudya, Gosairhat, Naria, Shariatpur Sadar, Zajira'),
    Tangail: list(
      'Basail, Bhuapur, Delduar, Dhanbari, Ghatail, Gopalpur, Kalihati, Madhupur, Mirzapur, Nagarpur, Sakhipur, Tangail Sadar'
    ),
  },
  Khulna: {
    Bagerhat: list(
      'Bagerhat Sadar, Chitalmari, Fakirhat, Kachua, Mollahat, Mongla, Morrelganj, Rampal, Sarankhola'
    ),
    Chuadanga: list('Alamdanga, Chuadanga Sadar, Damurhuda, Jibannagar'),
    Jashore: list(
      'Abhaynagar, Bagherpara, Chaugachha, Jashore Sadar, Jhikargachha, Keshabpur, Manirampur, Sharsha'
    ),
    Jhenaidah: list('Harinakunda, Jhenaidah Sadar, Kaliganj, Kotchandpur, Maheshpur, Shailkupa'),
    Khulna: list(
      'Batiaghata, Dacope, Daulatpur, Dighalia, Dumuria, Harintana, Khalishpur, Khan Jahan Ali, Khulna Sadar, Koyra, Labanchara, ' +
        'Paikgachha, Phultala, Rupsha, Sonadanga, Terokhada'
    ),
    Kushtia: list('Bheramara, Daulatpur, Khoksa, Kumarkhali, Kushtia Sadar, Mirpur'),
    Magura: list('Magura Sadar, Mohammadpur, Shalikha, Sreepur'),
    Meherpur: list('Gangni, Meherpur Sadar, Mujibnagar'),
    Narail: list('Kalia, Lohagara, Narail Sadar'),
    Satkhira: list('Assasuni, Debhata, Kalaroa, Kaliganj, Satkhira Sadar, Shyamnagar, Tala'),
  },
  Mymensingh: {
    Jamalpur: list(
      'Baksiganj, Dewanganj, Islampur, Jamalpur Sadar, Madarganj, Melandaha, Sarishabari'
    ),
    Mymensingh: list(
      'Bhaluka, Dhobaura, Fulbaria, Gaffargaon, Gauripur, Haluaghat, Ishwarganj, Muktagachha, Mymensingh Sadar, Nandail, Phulpur, Tarakanda, Trishal'
    ),
    Netrokona: list(
      'Atpara, Barhatta, Durgapur, Kalmakanda, Kendua, Khaliajuri, Madan, Mohanganj, Netrokona Sadar, Purbadhala'
    ),
    Sherpur: list('Jhenaigati, Nakla, Nalitabari, Sherpur Sadar, Sreebardi'),
  },
  Rajshahi: {
    Bogura: list(
      'Adamdighi, Bogura Sadar, Dhunat, Dhupchanchia, Gabtali, Kahaloo, Nandigram, Sariakandi, Shajahanpur, Sherpur, Shibganj, Sonatola'
    ),
    Chapainawabganj: list('Bholahat, Chapainawabganj Sadar, Gomastapur, Nachole, Shibganj'),
    Joypurhat: list('Akkelpur, Joypurhat Sadar, Kalai, Khetlal, Panchbibi'),
    Naogaon: list(
      'Atrai, Badalgachhi, Dhamoirhat, Manda, Mohadevpur, Naogaon Sadar, Niamatpur, Patnitala, Porsha, Raninagar, Sapahar'
    ),
    Natore: list('Bagatipara, Baraigram, Gurudaspur, Lalpur, Natore Sadar, Singra'),
    Pabna: list(
      'Atgharia, Bera, Bhangura, Chatmohar, Faridpur, Ishwardi, Pabna Sadar, Santhia, Sujanagar'
    ),
    Rajshahi: list(
      'Bagha, Bagmara, Boalia, Charghat, Durgapur, Godagari, Mohanpur, Motihar, Paba, Puthia, Rajpara, Shah Makhdum, Tanore'
    ),
    Sirajganj: list(
      'Belkuchi, Chauhali, Kamarkhanda, Kazipur, Raiganj, Shahjadpur, Sirajganj Sadar, Tarash, Ullahpara'
    ),
  },
  Rangpur: {
    Dinajpur: list(
      'Birampur, Birganj, Biral, Bochaganj, Chirirbandar, Dinajpur Sadar, Ghoraghat, Hakimpur, Kaharole, Khansama, Nawabganj, Parbatipur, Phulbari'
    ),
    Gaibandha: list(
      'Gaibandha Sadar, Gobindaganj, Palashbari, Phulchhari, Sadullapur, Sughatta, Sundarganj'
    ),
    Kurigram: list(
      'Bhurungamari, Char Rajibpur, Chilmari, Kurigram Sadar, Nageshwari, Phulbari, Rajarhat, Raomari, Ulipur'
    ),
    Lalmonirhat: list('Aditmari, Hatibandha, Kaliganj, Lalmonirhat Sadar, Patgram'),
    Nilphamari: list('Dimla, Domar, Jaldhaka, Kishoreganj, Nilphamari Sadar, Saidpur'),
    Panchagarh: list('Atwari, Boda, Debiganj, Panchagarh Sadar, Tetulia'),
    Rangpur: list(
      'Badarganj, Gangachara, Kaunia, Mithapukur, Pirgachha, Pirganj, Rangpur Sadar, Taraganj'
    ),
    Thakurgaon: list('Baliadangi, Haripur, Pirganj, Ranisankail, Thakurgaon Sadar'),
  },
  Sylhet: {
    Habiganj: list(
      'Ajmiriganj, Bahubal, Baniachong, Chunarughat, Habiganj Sadar, Lakhai, Madhabpur, Nabiganj, Shaistaganj'
    ),
    Moulvibazar: list('Barlekha, Juri, Kamalganj, Kulaura, Moulvibazar Sadar, Rajnagar, Sreemangal'),
    Sunamganj: list(
      'Bishwamvarpur, Chhatak, Dakshin Sunamganj, Derai, Dharampasha, Dowarabazar, Jagannathpur, Jamalganj, Madhyanagar, Sulla, Sunamganj Sadar, Tahirpur'
    ),
    Sylhet: list(
      'Balaganj, Beanibazar, Bishwanath, Companiganj, Dakshin Surma, Fenchuganj, Golapganj, Gowainghat, Jaintiapur, Kanaighat, Osmani Nagar, Sylhet Sadar, Zakiganj'
    ),
  },
};

// Last choice in every district (except Dhaka, whose list is complete) so a customer is never stuck
// when his/her thana is missing from the list. The exact place is then written in the local address.
export const OTHER_THANA = 'Other / Not listed';

const sortNames = (names: string[]) => [...names].sort((a, b) => a.localeCompare(b));

export const getDivisions = (): string[] => Object.keys(RAW).sort((a, b) => a.localeCompare(b));

export const getDistricts = (division: string): string[] =>
  RAW[division] ? sortNames(Object.keys(RAW[division])) : [];

export const getThanas = (division: string, district: string): string[] => {
  const thanas = RAW[division]?.[district];
  if (!thanas) return [];
  const sorted = sortNames(thanas);
  return district === 'Dhaka' && division === 'Dhaka' ? sorted : [...sorted, OTHER_THANA];
};

// true only for the Dhaka city police stations (Dhanmondi, Gulshan, Mirpur, Uttara ...). Savar, Keraniganj, Gazipur etc. are "outside".
export const isInsideDhakaMetro = (division: string, district: string, thana: string): boolean =>
  division === 'Dhaka' && district === 'Dhaka' && DHAKA_METRO_THANAS.includes(thana);

// ---- Save / read the location inside the order's existing "district" text ----

export const formatLocation = (division: string, district: string, thana: string): string =>
  `${thana}, ${district}, ${division} Division`;

export interface ParsedLocation {
  thana: string;
  district: string;
  division: string;
}

// Returns null for old orders (they only have a plain district like "Dhaka")
export const parseLocation = (value?: string): ParsedLocation | null => {
  if (!value) return null;
  const parts = value.split(',').map((p) => p.trim());
  if (parts.length !== 3 || !parts[2].endsWith(' Division')) return null;
  return {
    thana: parts[0],
    district: parts[1],
    division: parts[2].replace(/ Division$/, ''),
  };
};
