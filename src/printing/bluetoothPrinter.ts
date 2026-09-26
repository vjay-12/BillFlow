import type { Bill, BusinessProfile } from '../types';
import { buildEscPosReceipt } from './escpos';

class BluetoothPrinterService {
  private device: any = null;
  private characteristic: any = null;
  private isConnecting = false;

  isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  }

  async connect(): Promise<string> {
    if (!this.isSupported()) {
      throw new Error('Web Bluetooth is not supported in this browser. Please use Google Chrome or Edge on Android/Desktop.');
    }

    try {
      this.isConnecting = true;
      // Request device with common thermal printer services
      const navBluetooth = (navigator as any).bluetooth;
      const device = await navBluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          '000018f0-0000-1000-8000-00805f9b34fb',
          '49535343-fe7d-4ae5-8fa9-9fafd205e455',
          'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
          0x18f0,
        ],
      });

      this.device = device;
      const server = await device.gatt.connect();

      // Find writable characteristic
      const services = await server.getPrimaryServices();
      for (const service of services) {
        const characteristics = await service.getCharacteristics();
        for (const char of characteristics) {
          if (char.properties.write || char.properties.writeWithoutResponse) {
            this.characteristic = char;
            break;
          }
        }
        if (this.characteristic) break;
      }

      if (!this.characteristic) {
        throw new Error('Could not find writable printer characteristic.');
      }

      return device.name || 'Bluetooth Thermal Printer';
    } finally {
      this.isConnecting = false;
    }
  }

  async printReceipt(bill: Bill, profile: BusinessProfile): Promise<boolean> {
    if (!this.characteristic) {
      await this.connect();
    }

    if (!this.characteristic) {
      throw new Error('Printer is not connected.');
    }

    const bytes = buildEscPosReceipt(bill, profile);
    // Write in chunks of 512 bytes (standard BLE MTU limit safety)
    const chunkSize = 256;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.slice(i, i + chunkSize);
      if (this.characteristic.writeValueWithResponse) {
        await this.characteristic.writeValueWithResponse(chunk);
      } else {
        await this.characteristic.writeValue(chunk);
      }
    }

    return true;
  }

  async disconnect(): Promise<void> {
    if (this.device && this.device.gatt.connected) {
      await this.device.gatt.disconnect();
    }
    this.device = null;
    this.characteristic = null;
  }

  isConnected(): boolean {
    return !!(this.device && this.device.gatt && this.device.gatt.connected && this.characteristic);
  }

  getDeviceName(): string {
    return this.device?.name || 'No printer connected';
  }

  getIsConnecting(): boolean {
    return this.isConnecting;
  }
}

export const bluetoothPrinter = new BluetoothPrinterService();
