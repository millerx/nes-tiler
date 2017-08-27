/**
 * Functions to work with NES ROMs.
 */

const fs = require('fs')

const INesConsts = {
  HEADER_SIZE: 16,

  // Flags6
  FLAGS6_HORIZONTAL_MIRRORING: 0x01,
  FLAGS6_BATTERY_RAM: 0x02,
  FLAGS6_TRAINER: 0x04,
  FLAGS6_FOUR_SCREEN_VRAM: 0x08,
  // Flags7
  FLAGS7_VS_SYSTEM_CART: 0x01,
  // Flags9
  FLASG9_PAL_CART: 0x01,
}

/**
 * Creates an iNes header object from the given buffer.
 * Returns: {
 *   prgRomSize:  // Size of PRG ROM in 16 KB units
 *   chrRomSize:  // Size of CHR ROM in 8 KB units
 *   prgRamSize:  // Size of PRG RAM in 8 KB units (Value 0 infers 8 KB for compatibility)
 *   flags6:   // Flags for byte 6.
 *   flags7:   // Flags for byte 7.  
 *   flags9:   // Flags for byte 9.
 *   flags10:  // Flags for byte 10 (unofficial).
 *   mapper:   // Memory mapper used by the cartridge.  See http://fms.komkon.org/EMUL8/NES.html#LABM
 * }
 */
function readINesHeader(buffer) {
  let i = 0
  // An iNES header starts with NES^Z (4e 45 53 1a)
  if (buffer[i++] === 0x4e &&
      buffer[i++] === 0x45 &&
      buffer[i++] === 0x53 &&
      buffer[i++] === 0x1a) {
    var ines = {
      prgRomSize: buffer[i++],
      chrRomSize: buffer[i++],
      flags6: buffer[i++],
      flags7: buffer[i++],
      prgRamSize: buffer[i++],
      flags9: buffer[i++],
      flags10: buffer[i++],
    }
    // flags6 bit 4-7 has the lower 4 bits of the mapper.
    // flags7 bit 4-7 has the higher 4 bits of the mapper.
    ines.mapper = (ines.flags6 >> 4) + (ines.flags7 & 0xF0)
    return ines
  } else {
    // Not an iNES header.
    return null
  }
}

/**
 * Synchronously reads a ROM file.
 * Returns: {
 *   inesHeader: {},  // Object with iNES structure read from the file.  null if iNES header is not recogised.
 *   rom: Buffer      // Buffer containing the ROM including the iNES header.
 *   rom_no_header: Buffer  // Buffer containing the ROM excluding the iNES header. 
 * }
 */
exports.readRom = function(file) {
  const buffer = fs.readFileSync(file)
  const inesHeader = readINesHeader(buffer)
  return {
    inesHeader: inesHeader,
    rom: buffer,
    // slice() is a light weight operation.
    rom_no_header: inesHeader ? buffer.slice(INesConsts.HEADER_SIZE) : buffer
  }
}
