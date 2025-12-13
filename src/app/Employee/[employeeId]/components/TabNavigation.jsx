'use client';

export default function TabNavigation({ 
    activeTab, 
    setActiveTab, 
    setActiveSubTab,
    setShowAddMoreModal 
}) {
    return (
        <>
            <div className="px-6 pt-4">
                <div className="rounded-2xl shadow-sm px-6 py-4 flex items-center justify-between bg-transparent">
                    <div className="flex items-center gap-6 text-sm font-semibold">
                        <button
                            onClick={() => { setActiveTab('basic'); setActiveSubTab('basic-details'); }}
                            className={`relative pb-2 transition-colors ${activeTab === 'basic'
                                ? 'text-blue-600 after:content-[\'\'] after:absolute after:left-0 after:-bottom-1 after:w-full after:h-0.5 after:bg-blue-500'
                                : 'text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            Basic Details
                        </button>
                        <button
                            onClick={() => setActiveTab('work-details')}
                            className={`relative pb-2 transition-colors ${activeTab === 'work-details'
                                ? 'text-blue-600 after:content-[\'\'] after:absolute after:left-0 after:-bottom-1 after:w-full after:h-0.5 after:bg-blue-500'
                                : 'text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            Work Details
                        </button>
                        <button
                            onClick={() => setActiveTab('salary')}
                            className={`relative pb-2 transition-colors ${activeTab === 'salary'
                                ? 'text-blue-600 after:content-[\'\'] after:absolute after:left-0 after:-bottom-1 after:w-full after:h-0.5 after:bg-blue-500'
                                : 'text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            Salary
                        </button>
                        <button
                            onClick={() => setActiveTab('personal')}
                            className={`relative pb-2 transition-colors ${activeTab === 'personal'
                                ? 'text-blue-600 after:content-[\'\'] after:absolute after:left-0 after:-bottom-1 after:w-full after:h-0.5 after:bg-blue-500'
                                : 'text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            Personal Information
                        </button>
                    </div>
                    <button 
                        onClick={() => setShowAddMoreModal(true)}
                        className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-md flex items-center gap-2 shadow-sm"
                    >
                        Add More
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                    </button>
                </div>
            </div>
        </>
    );
}

