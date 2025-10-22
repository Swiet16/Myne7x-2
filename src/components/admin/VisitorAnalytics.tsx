import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getVisitorStats, type VisitorStats } from '@/lib/api/visitors';
import { Users, Globe, TrendingUp, Activity, MapPin, Monitor, Smartphone, Tablet, Search, ChevronDown, ChevronUp } from 'lucide-react';

// All 195 countries in the world (UN recognized + some territories)
const ALL_COUNTRIES = [
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 'Argentina', 'Armenia', 'Australia', 'Austria',
  'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan',
  'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cambodia', 'Cameroon',
  'Canada', 'Cape Verde', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo', 'Costa Rica',
  'Croatia', 'Cuba', 'Cyprus', 'Czech Republic', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic', 'Ecuador', 'Egypt',
  'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Ethiopia', 'Fiji', 'Finland', 'France', 'Gabon', 'Gambia',
  'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana', 'Haiti',
  'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy',
  'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kiribati', 'North Korea', 'South Korea', 'Kuwait', 'Kyrgyzstan',
  'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Macedonia',
  'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico',
  'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar', 'Namibia', 'Nauru',
  'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'Norway', 'Oman', 'Pakistan', 'Palau',
  'Palestine', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal', 'Qatar', 'Romania',
  'Russia', 'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 'Sao Tome and Principe', 'Saudi Arabia', 'Senegal',
  'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa', 'South Sudan',
  'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Swaziland', 'Sweden', 'Switzerland', 'Syria', 'Taiwan', 'Tajikistan',
  'Tanzania', 'Thailand', 'Timor-Leste', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu',
  'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan', 'Vanuatu', 'Vatican City', 'Venezuela',
  'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe', 'Hong Kong', 'Puerto Rico'
];

export const VisitorAnalytics = () => {
  const [stats, setStats] = useState<VisitorStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAllCountries, setShowAllCountries] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');

  useEffect(() => {
    fetchStats();
    // Refresh every 30 seconds for live updates
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    setIsLoading(true);
    const data = await getVisitorStats();
    setStats(data);
    setIsLoading(false);
  };

  if (isLoading && !stats) {
    return (
      <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm">
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-sm text-gray-600 mt-2">Loading visitor analytics...</p>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm">
        <CardContent className="p-6 text-center">
          <p className="text-sm text-gray-600">No visitor data available</p>
        </CardContent>
      </Card>
    );
  }

  const maxDailyCount = Math.max(...stats.dailyVisitors.map(d => d.count), 1);
  const maxHourlyCount = Math.max(...stats.hourlyVisitors.map(h => h.count), 1);

  // Filter countries based on search
  const filteredTopCountries = stats.topCountries.filter(country =>
    country.country.toLowerCase().includes(countrySearch.toLowerCase())
  );

  // Get all countries with their visitor counts (including zero counts)
  const allCountriesWithCounts = ALL_COUNTRIES.map(country => {
    const found = stats.topCountries.find(c => c.country === country);
    return {
      country,
      count: found ? found.count : 0
    };
  }).sort((a, b) => b.count - a.count);

  const displayedCountries = showAllCountries 
    ? allCountriesWithCounts.filter(c => c.country.toLowerCase().includes(countrySearch.toLowerCase()))
    : filteredTopCountries;

  return (
    <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-t-lg p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-1.5 text-white text-sm sm:text-base lg:text-lg">
              <Globe className="h-4 w-4 sm:h-5 sm:w-5" />
              🌍 Live Website Visitor Analytics
            </CardTitle>
            <CardDescription className="text-purple-100 text-[10px] sm:text-xs">
              Real-time visitor tracking with worldwide country detection (195+ countries)
            </CardDescription>
          </div>
          <Badge className="bg-green-500 text-white border-0 animate-pulse text-xs">
            <div className="w-2 h-2 bg-white rounded-full mr-1"></div>
            LIVE
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-2 sm:p-3 lg:p-4">
        {/* Visitor Count Stats - Enhanced Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-5">
          <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all">
            <Users className="h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-2 text-white" />
            <div className="text-2xl sm:text-3xl font-bold text-white">{stats.totalVisitors.toLocaleString()}</div>
            <div className="text-xs sm:text-sm font-semibold text-blue-100 mt-1">Total Visitors</div>
          </div>
          <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all">
            <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-2 text-white" />
            <div className="text-2xl sm:text-3xl font-bold text-white">{stats.todayVisitors.toLocaleString()}</div>
            <div className="text-xs sm:text-sm font-semibold text-green-100 mt-1">Today</div>
          </div>
          <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all">
            <Activity className="h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-2 text-white" />
            <div className="text-2xl sm:text-3xl font-bold text-white">{stats.weekVisitors.toLocaleString()}</div>
            <div className="text-xs sm:text-sm font-semibold text-purple-100 mt-1">This Week</div>
          </div>
          <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all">
            <Globe className="h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-2 text-white" />
            <div className="text-2xl sm:text-3xl font-bold text-white">{stats.monthVisitors.toLocaleString()}</div>
            <div className="text-xs sm:text-sm font-semibold text-pink-100 mt-1">This Month</div>
          </div>
        </div>

        {/* Worldwide Countries Section - Enhanced */}
        <div className="mb-4 sm:mb-5 p-3 sm:p-4 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-xl border-2 border-indigo-200 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm sm:text-base font-bold text-gray-900 flex items-center gap-2">
              <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600" />
              🌍 Worldwide Visitors By Country
            </h3>
            <Badge className="bg-indigo-600 text-white text-xs">
              {stats.topCountries.length} / 195 Countries
            </Badge>
          </div>

          {/* Search Bar */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search countries..."
              value={countrySearch}
              onChange={(e) => setCountrySearch(e.target.value)}
              className="pl-10 border-2 border-indigo-300 focus:border-indigo-500 text-sm"
            />
          </div>

          {/* Top Countries List */}
          <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
            {displayedCountries.length > 0 ? (
              displayedCountries.map((country, index) => {
                const isTopFive = index < 5 && !showAllCountries;
                const maxCount = displayedCountries[0]?.count || 1;
                const percentage = maxCount > 0 ? (country.count / maxCount) * 100 : 0;
                
                return (
                  <div key={index} className={`p-2 sm:p-3 rounded-lg border-2 transition-all hover:shadow-md ${
                    country.count > 0 
                      ? 'bg-white border-indigo-200 hover:border-indigo-400' 
                      : 'bg-gray-50 border-gray-200 opacity-60'
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs sm:text-sm font-bold text-gray-900 flex items-center gap-2">
                        {isTopFive && <span className="text-lg">{['🥇', '🥈', '🥉', '🏅', '🏅'][index]}</span>}
                        <span className="text-base mr-1">{getCountryFlag(country.country)}</span>
                        {country.country}
                      </span>
                      <span className={`text-xs sm:text-sm font-bold ${
                        country.count > 0 ? 'text-indigo-700' : 'text-gray-500'
                      }`}>
                        {country.count.toLocaleString()} {country.count === 1 ? 'visit' : 'visits'}
                      </span>
                    </div>
                    {country.count > 0 && (
                      <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-full rounded-full transition-all duration-700 shadow-sm"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="text-xs sm:text-sm text-gray-600 text-center py-4">
                {countrySearch ? 'No countries match your search' : 'No country data yet'}
              </p>
            )}
          </div>

          {/* Show All Countries Toggle */}
          <div className="mt-3 pt-3 border-t-2 border-indigo-200">
            <Button
              onClick={() => setShowAllCountries(!showAllCountries)}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-semibold text-xs sm:text-sm"
            >
              {showAllCountries ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-2" />
                  Show Top Countries Only
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-2" />
                  Show All 195 Countries
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Daily Visitors Graph (Last 7 Days) - Enhanced */}
        <div className="mb-4 sm:mb-5 p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-200 shadow-lg">
          <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
            📈 Daily Growth Trend (Last 7 Days)
          </h3>
          <div className="flex items-end justify-between gap-2 h-32 sm:h-40 bg-white rounded-lg p-3 border border-blue-200">
            {stats.dailyVisitors.map((day, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                <div className="relative flex-1 w-full flex items-end">
                  <div 
                    className="w-full bg-gradient-to-t from-blue-600 to-cyan-400 rounded-t-lg transition-all duration-500 hover:from-blue-700 hover:to-cyan-500 cursor-pointer relative group shadow-lg"
                    style={{ height: `${(day.count / maxDailyCount) * 100}%`, minHeight: day.count > 0 ? '12px' : '4px' }}
                  >
                    <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-xs font-bold text-gray-900 bg-white px-2 py-1 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {day.count} visits
                    </span>
                  </div>
                </div>
                <span className="text-[9px] sm:text-xs font-bold text-gray-700 text-center">{day.date}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Hourly Visitors Graph (Today) - Enhanced */}
        <div className="p-3 sm:p-4 bg-gradient-to-br from-green-50 to-teal-50 rounded-xl border-2 border-green-200 shadow-lg">
          <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
            ⚡ Hourly Activity Pattern (Today - 24 Hours)
          </h3>
          <div className="flex items-end justify-between gap-1 h-28 sm:h-32 overflow-x-auto bg-white rounded-lg p-3 border border-green-200 custom-scrollbar">
            {stats.hourlyVisitors.map((hour, index) => (
              <div key={index} className="flex flex-col items-center gap-1 min-w-[16px]">
                <div className="relative flex-1 w-full flex items-end">
                  <div 
                    className="w-full bg-gradient-to-t from-green-600 to-teal-400 rounded-t-lg transition-all duration-500 hover:from-green-700 hover:to-teal-500 cursor-pointer relative group shadow-md"
                    style={{ 
                      height: `${hour.count > 0 ? Math.max((hour.count / maxHourlyCount) * 100, 8) : 0}%`, 
                      minHeight: hour.count > 0 ? '6px' : '0' 
                    }}
                  >
                    <span className="absolute -top-7 left-1/2 transform -translate-x-1/2 text-[10px] font-bold text-gray-900 bg-white px-1.5 py-0.5 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      {hour.count}
                    </span>
                  </div>
                </div>
                {index % 2 === 0 && (
                  <span className="text-[8px] sm:text-[10px] font-bold text-gray-700 whitespace-nowrap">
                    {hour.hour.split(':')[0]}h
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Live Update Indicator */}
        <div className="mt-4 flex items-center justify-center gap-2 text-xs sm:text-sm text-gray-600 bg-green-50 py-2 rounded-lg border border-green-200">
          <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div>
          <span className="font-bold">🔄 Auto-refreshing every 30 seconds</span>
        </div>
      </CardContent>
    </Card>
  );
};

// Helper function to get country flag emoji
function getCountryFlag(countryName: string): string {
  const countryFlags: Record<string, string> = {
    'United States': '🇺🇸', 'United Kingdom': '🇬🇧', 'Canada': '🇨🇦', 'Australia': '🇦🇺', 'Germany': '🇩🇪',
    'France': '🇫🇷', 'Italy': '🇮🇹', 'Spain': '🇪🇸', 'Netherlands': '🇳🇱', 'Sweden': '🇸🇪',
    'Norway': '🇳🇴', 'Denmark': '🇩🇰', 'Finland': '🇫🇮', 'Poland': '🇵🇱', 'Russia': '🇷🇺',
    'China': '🇨🇳', 'Japan': '🇯🇵', 'South Korea': '🇰🇷', 'India': '🇮🇳', 'Pakistan': '🇵🇰',
    'Bangladesh': '🇧🇩', 'Brazil': '🇧🇷', 'Mexico': '🇲🇽', 'Argentina': '🇦🇷', 'Chile': '🇨🇱',
    'South Africa': '🇿🇦', 'Egypt': '🇪🇬', 'Nigeria': '🇳🇬', 'Kenya': '🇰🇪', 'Turkey': '🇹🇷',
    'Saudi Arabia': '🇸🇦', 'UAE': '🇦🇪', 'United Arab Emirates': '🇦🇪', 'Israel': '🇮🇱', 'Indonesia': '🇮🇩',
    'Malaysia': '🇲🇾', 'Singapore': '🇸🇬', 'Thailand': '🇹🇭', 'Vietnam': '🇻🇳', 'Philippines': '🇵🇭',
    'New Zealand': '🇳🇿', 'Ireland': '🇮🇪', 'Belgium': '🇧🇪', 'Switzerland': '🇨🇭', 'Austria': '🇦🇹',
    'Portugal': '🇵🇹', 'Greece': '🇬🇷', 'Czech Republic': '🇨🇿', 'Romania': '🇷🇴', 'Hungary': '🇭🇺',
    'Ukraine': '🇺🇦', 'Hong Kong': '🇭🇰', 'Taiwan': '🇹🇼', 'Puerto Rico': '🇵🇷'
  };
  return countryFlags[countryName] || '🌍';
}