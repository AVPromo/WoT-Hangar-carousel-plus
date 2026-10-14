# -*- coding: utf-8 -*-
"""Exercise the actual wrappers without importing or executing client bytecode."""
import ast
import sys
import unittest

SOURCE = sys.argv.pop(1)

class EventIsolationTest(unittest.TestCase):
    def setUp(self):
        calls = self.calls = []
        class Native(object):
            def __init__(self):
                calls.append(('init',))
            def _onLoading(self, *args, **kwargs):
                calls.append(('load', args, kwargs))
                return 'loaded'
            def _finalize(self):
                calls.append(('finalize',))
                return 'finalized'
            def passthrough(self, value):
                calls.append(('payload', value))
                return value
        Native._VehicleFiltersDataProvider__onCarouselTypeChanged = Native.passthrough
        Native._VehiclesStatisticsPresenter__updateVehicles = Native.passthrough
        Native._VehiclesStatisticsPresenter__onUpdateVehicles = Native.passthrough
        names = {'_is_hangar_presenter', '_patch_vehicle_filters_provider', '_patch_vehicle_statistics_presenter'}
        with open(SOURCE, 'rb') as stream:
            tree = ast.parse(stream.read(), SOURCE)
        body = [n for n in tree.body if isinstance(n, ast.FunctionDef) and n.name in names]
        self.assertEqual(set(n.name for n in body), names)
        module = ast.Module(body=body)
        ast.fix_missing_locations(module)
        self.env = {'VehicleFiltersDataProvider': Native, 'VehiclesStatisticsPresenter': Native, 'STATISTICS_PRESENTERS': []}
        exec(compile(module, SOURCE, 'exec'), self.env)
        self.env['_patch_vehicle_filters_provider']()
        self.env['_patch_vehicle_statistics_presenter']()
        namespace = 'fort_rush.gui.impl.battle.presenters.fort_rush_vehicle_filters_presenter'
        self.obj = type('FortRushPresenter', (Native,), {'__module__': namespace})()

    def test_battle_lifecycle_is_native(self):
        self.assertEqual(self.obj._onLoading(7, extra=True), 'loaded')
        self.assertEqual(self.obj._finalize(), 'finalized')
        self.assertIn(('load', (7,), {'extra': True}), self.calls)

    def test_battle_row_payload_is_native(self):
        payload = {'rowCount': 2, 'modeSpecific': True}
        self.assertIs(self.obj._VehicleFiltersDataProvider__onCarouselTypeChanged(payload), payload)

    def test_battle_vehicle_selection_is_unfiltered(self):
        vehicles = {7: object(), 8: object()}
        diff = iter([7, 8])
        self.assertIs(self.obj._VehiclesStatisticsPresenter__updateVehicles(vehicles), vehicles)
        self.assertIs(self.obj._VehiclesStatisticsPresenter__onUpdateVehicles(diff), diff)
        self.assertEqual(self.env['STATISTICS_PRESENTERS'], [])

    def test_reviewed_lobby_and_unknown_scope(self):
        for namespace, expected in [('gui.impl.lobby.hangar.presenters.filters', True), ('comp7_core.gui.impl.lobby.hangar.presenters.filters', True), ('unknown.gui.impl.lobby.filters', False), ('fort_rush.gui.impl.lobby.presenters.filters', True), ('halloween.gui.impl.lobby.hangar_view', False)]:
            obj = type('Presenter', (object,), {'__module__': namespace})()
            self.assertEqual(self.env['_is_hangar_presenter'](obj), expected)

if __name__ == '__main__':
    unittest.main()
