export const commonStopWords: Array<string | RegExp> = [
  //
  'закажи',
  'дебетовую',
  'vk.cc',
  'похyдени',
  /получи.*бонус/gm,
  /сдам.*квартиру/,
  /сдам.*гараж/,
  /долгосрочную.*аренду/,
  /z[aа]/,
  /zov/,
  /z.o.v/,
  /народн.*фронт/,
  /военкор/,
  /военн.*служб/,
  /по контракту/,
  /clck/,
  /диагноз/,
];

export const userStopWords: Array<string | RegExp> = [
  //
  'sber-bank',
  'away.php',
];

export const groupStopWords: Array<string | RegExp> = [
  //
  /club\d+/gm,
  /public\d+/gm,
  'реклама',
  'подписывайся',
  'вступайте',
  'объявления',
  'voen',
  'займ',
  //
  'вакансия',
  'требуются',
  'наш телеграм',
  //
  'битые',
  'после дтп',
  'в день обращения',
  'выкуп',
  'купим авто',
  'куплю',
  //
  'роллы',
  'бизнес ланч',
  'кафе',
  'доставка',
  /грузоперевозки\s+по\s+/,
  //
  'detali18',
  'колибри',
  'магазин',
  'прайс',
  'озон',
  'заказывай',
  'корпорация центр',
  'eva',
  'jcar',
  'дрова',
  'учи.ру',
  'пятнашки',
  'химчистка',
  'химчистку',
  'поликарбонат',
  'такси',
  'vr-zone',
  'арена виртуальной',
  'woldemar',
  /бар.*спички/,
  'сталькомплект',
  'металлокровл',
  'профнастил',
  'металлочерепица',
  'er.ru',
  'нечкино',
  'концерт',
  'avtoroom',
  'график работы',
  'корпорация центр',
  'обувь',
  'торговый центр',
  'автомир',
  'automir',
  'ситилинк',
  'косметолог',
  'банкротств',
  'цех_18',
  'кроссовки',
  /рыб.*камчатк/,
  /икр[ауы]\s/,
  'меховых изделий',
  'меховой компании',
];
