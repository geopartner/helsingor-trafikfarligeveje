#!/usr/bin/python
# -*- coding: utf-8 -*-
'''
A translation function for TIGER 2012 counties
'''

def filterTags(attrs):
    if not attrs:
        return
    tags = {}
    '''
    print type(u'Lokalvej-Primær')
    print attrs['vejklasse_']
    print type(attrs['vejklasse_'])
    '''

    klasse = attrs['vejklasse_']
    if klasse == u'Lokalvej-Primær':
        tags['highway'] = 'primary'
    if klasse == u'Lokalvej-Sekundær':
        tags['highway'] = 'secondary'
    if klasse == u'Lokalvej-Tertiær':
        tags['highway'] = 'tertiary'
    if klasse == u'Anden vej':
        tags['highway'] = 'service'
    if klasse == u'Trafikvej-Gennemfart':
        tags['highway'] = 'motorway_link'            
    if klasse == u'Indkørselsvej':
        tags['highway'] = 'service'
    if klasse == u'Hovedsti':
        tags['highway'] = 'footway'
        tags['bicycle'] = 'yes'
    if klasse == u'Sti, diverse':
        tags['highway'] = 'footway'
        tags['bicycle'] = 'yes'
    if klasse == u'Cykelsti langs vej':
        tags['highway'] = 'cycleway'
    if klasse == u'Cykelbane langs vej':
        tags['highway'] = 'cycleway'
    if attrs['oneway'] == u'1':
        tags['oneway'] = 'yes'

    return tags