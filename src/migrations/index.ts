import * as migration_20261006_174118_initial from './20261006_174118_initial';
import * as migration_20261006_182751_booking_two_step from './20261006_182751_booking_two_step';
import * as migration_20261006_184918_booking_full_name from './20261006_184918_booking_full_name';
import * as migration_20261006_191153_gallery_showcase from './20261006_191153_gallery_showcase';
import * as migration_20261006_193551_gallery_backdrop from './20261006_193551_gallery_backdrop';
import * as migration_20261007_141909_onboarding from './20261007_141909_onboarding';
import * as migration_20261009_132904_gallery_variant from './20261009_132904_gallery_variant';
import * as migration_20261009_134924_remove_section_disclaimers from './20261009_134924_remove_section_disclaimers';
import * as migration_20261009_150835_risk_profile from './20261009_150835_risk_profile';
import * as migration_20261010_091022_sebi_disclosures from './20261010_091022_sebi_disclosures';
import * as migration_20261010_093122_book_call_variant from './20261010_093122_book_call_variant';
import * as migration_20261010_094556_book_call_icons_bookings from './20261010_094556_book_call_icons_bookings';
import * as migration_20261011_090000_market_data from './20261011_090000_market_data';
import * as migration_20261011_094405_portfolio_scan_globals from './20261011_094405_portfolio_scan_globals';
import * as migration_20261011_100000_scan_data from './20261011_100000_scan_data';
import * as migration_20261017_173657_gallery_collage from './20261017_173657_gallery_collage';
import * as migration_20261017_191214_storage_object_key from './20261017_191214_storage_object_key';
import * as migration_20261023_062654_booking_preferred_at from './20261023_062654_booking_preferred_at';
import * as migration_20261023_064519_highlights_orbit from './20261023_064519_highlights_orbit';
import * as migration_20261025_090000_portal_data from './20261025_090000_portal_data';

export const migrations = [
  {
    up: migration_20261006_174118_initial.up,
    down: migration_20261006_174118_initial.down,
    name: '20261006_174118_initial',
  },
  {
    up: migration_20261006_182751_booking_two_step.up,
    down: migration_20261006_182751_booking_two_step.down,
    name: '20261006_182751_booking_two_step',
  },
  {
    up: migration_20261006_184918_booking_full_name.up,
    down: migration_20261006_184918_booking_full_name.down,
    name: '20261006_184918_booking_full_name',
  },
  {
    up: migration_20261006_191153_gallery_showcase.up,
    down: migration_20261006_191153_gallery_showcase.down,
    name: '20261006_191153_gallery_showcase',
  },
  {
    up: migration_20261006_193551_gallery_backdrop.up,
    down: migration_20261006_193551_gallery_backdrop.down,
    name: '20261006_193551_gallery_backdrop',
  },
  {
    up: migration_20261007_141909_onboarding.up,
    down: migration_20261007_141909_onboarding.down,
    name: '20261007_141909_onboarding',
  },
  {
    up: migration_20261009_132904_gallery_variant.up,
    down: migration_20261009_132904_gallery_variant.down,
    name: '20261009_132904_gallery_variant',
  },
  {
    up: migration_20261009_134924_remove_section_disclaimers.up,
    down: migration_20261009_134924_remove_section_disclaimers.down,
    name: '20261009_134924_remove_section_disclaimers',
  },
  {
    up: migration_20261009_150835_risk_profile.up,
    down: migration_20261009_150835_risk_profile.down,
    name: '20261009_150835_risk_profile',
  },
  {
    up: migration_20261010_091022_sebi_disclosures.up,
    down: migration_20261010_091022_sebi_disclosures.down,
    name: '20261010_091022_sebi_disclosures',
  },
  {
    up: migration_20261010_093122_book_call_variant.up,
    down: migration_20261010_093122_book_call_variant.down,
    name: '20261010_093122_book_call_variant',
  },
  {
    up: migration_20261010_094556_book_call_icons_bookings.up,
    down: migration_20261010_094556_book_call_icons_bookings.down,
    name: '20261010_094556_book_call_icons_bookings',
  },
  {
    up: migration_20261011_090000_market_data.up,
    down: migration_20261011_090000_market_data.down,
    name: '20261011_090000_market_data',
  },
  {
    up: migration_20261011_094405_portfolio_scan_globals.up,
    down: migration_20261011_094405_portfolio_scan_globals.down,
    name: '20261011_094405_portfolio_scan_globals',
  },
  {
    up: migration_20261011_100000_scan_data.up,
    down: migration_20261011_100000_scan_data.down,
    name: '20261011_100000_scan_data',
  },
  {
    up: migration_20261017_173657_gallery_collage.up,
    down: migration_20261017_173657_gallery_collage.down,
    name: '20261017_173657_gallery_collage',
  },
  {
    up: migration_20261017_191214_storage_object_key.up,
    down: migration_20261017_191214_storage_object_key.down,
    name: '20261017_191214_storage_object_key',
  },
  {
    up: migration_20261023_062654_booking_preferred_at.up,
    down: migration_20261023_062654_booking_preferred_at.down,
    name: '20261023_062654_booking_preferred_at',
  },
  {
    up: migration_20261023_064519_highlights_orbit.up,
    down: migration_20261023_064519_highlights_orbit.down,
    name: '20261023_064519_highlights_orbit',
  },
  {
    up: migration_20261025_090000_portal_data.up,
    down: migration_20261025_090000_portal_data.down,
    name: '20261025_090000_portal_data',
  },
];
