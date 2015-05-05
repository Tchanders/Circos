# Circos

## 2DO for the info panel

1. Requests to solr only work for small clusters due to the limits imposed by using method 'GET' for the ajax call. __SOLUTION__ ---> Use 'POST' method which i have done but it doesn't seem to have any effect.

2. The hoverboxe code for the expression clusters should contain the name of the condition, which must come from solr. Have done that but the d3 events for the hover boxes need be moved in the promise callback but if i do that i lose the d3 events.

3. The info panel code should only be executed if the large display is active.

4. The dimensions for the info panel.
    1. They are determined from the dimensions of the graph container, which works fine but maybe we want to change it.
    2. They do not respond to browser window size changes.

## General 2DO

1. Some of the scripts are getting large. Maybe split them up in individual modules?

2. We ~~should probably~~ __need to__ write a generalised solr post module. I will try to put something together Monday 4/5.

