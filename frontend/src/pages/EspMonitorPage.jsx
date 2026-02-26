import { useState } from 'react';
import { Radio, Wifi, WifiOff, Power, Activity, Cpu, HardDrive } from 'lucide-react';
import { espEnable, espDisable } from '../utils/api';
import AnimatedBackground from '../components/AnimatedBackground';

const EspMonitorPage = () => {
  const [devices, setDevices] = useState([
    {
      id: 'ESP32_001',
      name: 'Field Sensor A',
      enabled: true,
      online: true,
      lastSeen: new Date(),
      ip: '192.168.1.101',
      freeHeap: 45000,
      uptime: '2d 14h',
    },
    {
      id: 'ESP32_002',
      name: 'Field Sensor B',
      enabled: true,
      online: true,
      lastSeen: new Date(Date.now() - 300000),
      ip: '192.168.1.102',
      freeHeap: 42000,
      uptime: '1d 8h',
    },
    {
      id: 'ESP32_003',
      name: 'Field Sensor C',
      enabled: false,
      online: false,
      lastSeen: new Date(Date.now() - 3600000),
      ip: '192.168.1.103',
      freeHeap: 0,
      uptime: '0h',
    },
  ]);

  const toggleDevice = async (deviceId, currentState) => {
    try {
      if (currentState) {
        await espDisable(deviceId);
      } else {
        await espEnable(deviceId);
      }
      
      setDevices(devices.map(d => 
        d.id === deviceId ? { ...d, enabled: !currentState } : d
      ));
    } catch (error) {
      console.error('Failed to toggle device:', error);
      alert('Failed to toggle device');
    }
  };

  const getTimeSince = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div className="relative min-h-screen">
      <AnimatedBackground />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        <div className="text-center mb-12">
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4 text-gray-900">
            <span className="gradient-text">ESP Device Monitor</span>
          </h1>
          <p className="text-gray-700">Manage and monitor your IoT field sensors</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {[
            { icon: Radio, label: 'Total Devices', value: devices.length, color: 'green' },
            { icon: Wifi, label: 'Online', value: devices.filter(d => d.online).length, color: 'green' },
            { icon: WifiOff, label: 'Offline', value: devices.filter(d => !d.online).length, color: 'red' },
          ].map((stat, index) => (
            <div key={index} className="glass rounded-2xl p-6 flex items-center space-x-4 card-shadow">
              <div className={`w-12 h-12 rounded-xl bg-${stat.color}-100 flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-6">
          {devices.map((device) => (
            <div key={device.id} className="glass rounded-2xl p-6 md:p-8 card-shadow">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
                <div className="flex items-center space-x-4 mb-4 md:mb-0">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center shadow-lg ${
                    device.online ? 'bg-green-100' : 'bg-gray-200'
                  }`}>
                    <Radio className={`w-7 h-7 ${device.online ? 'text-green-600' : 'text-gray-500'}`} />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{device.name}</h3>
                    <p className="text-sm text-gray-600">{device.id}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className={`px-4 py-2 rounded-lg flex items-center space-x-2 shadow-md ${
                    device.online ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {device.online ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                    <span className="text-sm font-semibold">{device.online ? 'Online' : 'Offline'}</span>
                  </div>

                  <button
                    onClick={() => toggleDevice(device.id, device.enabled)}
                    className={`px-6 py-2 rounded-lg font-semibold flex items-center space-x-2 transition-all shadow-md ${
                      device.enabled
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    <Power className="w-4 h-4" />
                    <span>{device.enabled ? 'Disable' : 'Enable'}</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="glass rounded-xl p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Activity className="w-4 h-4 text-green-600" />
                    <span className="text-xs text-gray-600">Last Seen</span>
                  </div>
                  <div className="font-semibold text-gray-900">{getTimeSince(device.lastSeen)}</div>
                </div>

                <div className="glass rounded-xl p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Wifi className="w-4 h-4 text-green-600" />
                    <span className="text-xs text-gray-600">IP Address</span>
                  </div>
                  <div className="font-semibold text-sm text-gray-900">{device.ip}</div>
                </div>

                <div className="glass rounded-xl p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <HardDrive className="w-4 h-4 text-green-600" />
                    <span className="text-xs text-gray-600">Free Heap</span>
                  </div>
                  <div className="font-semibold text-gray-900">{(device.freeHeap / 1000).toFixed(1)}KB</div>
                </div>

                <div className="glass rounded-xl p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Cpu className="w-4 h-4 text-green-600" />
                    <span className="text-xs text-gray-600">Uptime</span>
                  </div>
                  <div className="font-semibold text-gray-900">{device.uptime}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="glass rounded-2xl p-8 mt-8 card-shadow">
          <h3 className="font-semibold text-lg mb-4 text-gray-900">Device Management</h3>
          <div className="space-y-3 text-sm text-gray-700">
            <p>• Devices automatically report status every 30 seconds</p>
            <p>• Disabled devices will stop capturing and uploading images</p>
            <p>• Enable devices remotely to resume monitoring</p>
            <p>• Monitor heap memory to detect potential issues</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EspMonitorPage;
