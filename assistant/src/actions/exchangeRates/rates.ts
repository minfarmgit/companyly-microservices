export enum Currency {
    EUR = 'EURRUB',
    USD = 'USDRUB',
    BYN = 'BYNRUB',
}
export const currencyVariables: Record<Currency, string[]>  = {
    [Currency.EUR]: [
        'евро'
    ],
    [Currency.USD]: [
        'доллар'
    ],
    [Currency.BYN]: [
        'белорусские рубли',
        'белорусские',
    ],
}

export const currencyResponseName: Record<Currency, string>  = {
    [Currency.EUR]: 'Евро',
    [Currency.USD]: 'Доллара',
    [Currency.BYN]: 'Белорусских рублей',
}