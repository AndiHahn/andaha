#FROM envoyproxy/envoy:v1.14.2

#COPY envoy.yaml /tmpl/envoy.yaml.tmpl
#COPY docker-entrypoint.sh /

#RUN chmod 500 /docker-entrypoint.sh

#RUN apt-get update && \
#    apt-get install gettext -y

#ENTRYPOINT ["/docker-entrypoint.sh"]

FROM envoyproxy/envoy:v1.14.1
COPY envoy.yaml /etc/envoy/envoy.yaml
RUN chmod go+r /etc/envoy/envoy.yaml