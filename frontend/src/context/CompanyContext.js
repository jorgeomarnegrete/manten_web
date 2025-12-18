import React, { createContext, useState, useEffect, useContext } from 'react';
import { getCompanySettings, uploadCompanyLogo, API_URL } from '../api';
import { useAuth } from './AuthContext';

const CompanyContext = createContext(null);

export const CompanyProvider = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const [companyData, setCompanyData] = useState({ name: 'MantenPro', logo_url: null });
    const [loading, setLoading] = useState(true);
    const [logoTimestamp, setLogoTimestamp] = useState(Date.now());

    const fetchCompanyData = async () => {
        try {
            const data = await getCompanySettings();
            setCompanyData(data);
        } catch (error) {
            console.error("Error loading company settings:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            fetchCompanyData();
        } else {
            setCompanyData({ name: 'MantenPro', logo_url: null });
            setLoading(false);
        }
    }, [isAuthenticated]);

    const refreshCompanyData = () => {
        fetchCompanyData();
    };

    const uploadLogo = async (file) => {
        const response = await uploadCompanyLogo(file);
        setLogoTimestamp(Date.now()); // Update timestamp to bust cache
        
        // Optimistically update or re-fetch
        setCompanyData(prev => ({
            ...prev,
            logo_url: response.logo_url
        }));
        
        return response;
    };

    // Helper to get full logo URL with cache busting
    const getLogoUrl = () => {
        if (!companyData.logo_url) return null;
        
        const baseUrl = companyData.logo_url.startsWith('http') 
            ? companyData.logo_url 
            : `${API_URL}${companyData.logo_url}`;
            
        return `${baseUrl}?t=${logoTimestamp}`;
    };

    const value = {
        companyData,
        loading,
        refreshCompanyData,
        uploadLogo,
        getLogoUrl
    };

    return (
        <CompanyContext.Provider value={value}>
            {children}
        </CompanyContext.Provider>
    );
};

export const useCompany = () => {
    const context = useContext(CompanyContext);
    if (!context) {
        throw new Error('useCompany must be used within a CompanyProvider');
    }
    return context;
};
