import { Country, State } from 'country-state-city';

export const formatPhoneForInput = (value) => value ? value.replace(/^\+/, '') : '';

export const formatPhoneForSave = (value) => {
    if (!value) return '';
    return value.startsWith('+') ? value : `+${value}`;
};

export const normalizeText = (value = '') => value.toLowerCase().replace(/[^a-z0-9]/g, '');

export const normalizeContactNumber = (value) => {
    if (!value) return '';
    const trimmed = value.toString().trim();
    if (!trimmed) return '';
    const cleaned = trimmed.replace(/[^\d+]/g, '');
    if (!cleaned) return '';
    return cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
};

export const getCountryName = (code) => {
    if (!code) return '';
    const country = Country.getCountryByCode(code);
    return country ? country.name : code;
};

export const getStateName = (countryCode, stateCode) => {
    if (!countryCode || !stateCode) return stateCode || '';
    const state = State.getStateByCodeAndCountry(stateCode, countryCode);
    return state ? state.name : stateCode;
};

export const getFullLocation = (city, state, country) => {
    const parts = [];
    if (city) parts.push(city);
    if (state && country) parts.push(getStateName(country, state));
    else if (state) parts.push(state);
    if (country) parts.push(getCountryName(country));
    return parts.join(', ');
};

export const sanitizeContact = (contact) => ({
    name: contact?.name?.trim() || '',
    relation: contact?.relation || 'Self',
    number: normalizeContactNumber(contact?.number || '')
});

export const contactsAreSame = (a, b) => {
    if (!a || !b) return false;
    const nameA = (a.name || '').trim().toLowerCase();
    const nameB = (b.name || '').trim().toLowerCase();
    return (a.number || '').trim() === (b.number || '').trim() && nameA === nameB;
};

export const getInitials = (firstName, lastName) => {
    const first = (firstName || '').charAt(0).toUpperCase();
    const last = (lastName || '').charAt(0).toUpperCase();
    return (first + last).toUpperCase();
};

export const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export const calculateDaysUntilExpiry = (expiryDate) => {
    if (!expiryDate) return null;
    try {
        const expiry = new Date(expiryDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        expiry.setHours(0, 0, 0, 0);
        const diffTime = expiry - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    } catch (e) {
        return null;
    }
};

export const calculateTenure = (dateOfJoining) => {
    if (!dateOfJoining) return null;
    const joinDate = new Date(dateOfJoining);
    const today = new Date();
    const years = today.getFullYear() - joinDate.getFullYear();
    const months = today.getMonth() - joinDate.getMonth();
    const totalMonths = years * 12 + months;
    const finalYears = Math.floor(totalMonths / 12);
    const finalMonths = totalMonths % 12;
    return { years: finalYears, months: finalMonths };
};

export const getAllCountriesOptions = () => {
    const { Country } = require('country-state-city');
    return Country.getAllCountries().map(country => ({
        value: country.name,
        label: country.name
    })).sort((a, b) => a.label.localeCompare(b.label));
};

export const getAllCountryNames = () => {
    const { Country } = require('country-state-city');
    return Country.getAllCountries().map(country => country.name);
};

